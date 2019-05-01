/*
 * Copyright 2014-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/Memory.h>
#include <folly/ScopeGuard.h>

#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventHandler.h>
#include <folly/io/async/test/SocketPair.h>
#include <folly/io/async/test/Util.h>
#include <folly/portability/Unistd.h>

#include <folly/futures/Promise.h>

#include <atomic>
#include <iostream>
#include <memory>
#include <thread>

using std::atomic;
using std::cerr;
using std::deque;
using std::endl;
using std::make_pair;
using std::pair;
using std::thread;
using std::unique_ptr;
using std::vector;
using std::chrono::duration_cast;
using std::chrono::microseconds;
using std::chrono::milliseconds;

using namespace std::chrono_literals;

using namespace folly;

///////////////////////////////////////////////////////////////////////////
// Tests for read and write events
///////////////////////////////////////////////////////////////////////////

enum { BUF_SIZE = 4096 };

ssize_t writeToFD(int fd, size_t length) {
  // write an arbitrary amount of data to the fd
  auto bufv = vector<char>(length);
  auto buf = bufv.data();
  memset(buf, 'a', length);
  ssize_t rc = write(fd, buf, length);
  CHECK_EQ(rc, length);
  return rc;
}

size_t writeUntilFull(int fd) {
  // Write to the fd until EAGAIN is returned
  size_t bytesWritten = 0;
  char buf[BUF_SIZE];
  memset(buf, 'a', sizeof(buf));
  while (true) {
    ssize_t rc = write(fd, buf, sizeof(buf));
    if (rc < 0) {
      CHECK_EQ(errno, EAGAIN);
      break;
    } else {
      bytesWritten += rc;
    }
  }
  return bytesWritten;
}

ssize_t readFromFD(int fd, size_t length) {
  // write an arbitrary amount of data to the fd
  auto buf = vector<char>(length);
  return read(fd, buf.data(), length);
}

size_t readUntilEmpty(int fd) {
  // Read from the fd until EAGAIN is returned
  char buf[BUF_SIZE];
  size_t bytesRead = 0;
  while (true) {
    int rc = read(fd, buf, sizeof(buf));
    if (rc == 0) {
      CHECK(false) << "unexpected EOF";
    } else if (rc < 0) {
      CHECK_EQ(errno, EAGAIN);
      break;
    } else {
      bytesRead += rc;
    }
  }
  return bytesRead;
}

void checkReadUntilEmpty(int fd, size_t expectedLength) {
  ASSERT_EQ(readUntilEmpty(fd), expectedLength);
}

struct ScheduledEvent {
  int milliseconds;
  uint16_t events;
  size_t length;
  ssize_t result;

  void perform(int fd) {
    if (events & EventHandler::READ) {
      if (length == 0) {
        result = readUntilEmpty(fd);
      } else {
        result = readFromFD(fd, length);
      }
    }
    if (events & EventHandler::WRITE) {
      if (length == 0) {
        result = writeUntilFull(fd);
      } else {
        result = writeToFD(fd, length);
      }
    }
  }
};

void scheduleEvents(EventBase* eventBase, int fd, ScheduledEvent* events) {
  for (ScheduledEvent* ev = events; ev->milliseconds > 0; ++ev) {
    eventBase->tryRunAfterDelay(
        std::bind(&ScheduledEvent::perform, ev, fd), ev->milliseconds);
  }
}

class TestHandler : public EventHandler {
 public:
  TestHandler(EventBase* eventBase, int fd)
      : EventHandler(eventBase, fd), fd_(fd) {}

  void handlerReady(uint16_t events) noexcept override {
    ssize_t bytesRead = 0;
    ssize_t bytesWritten = 0;
    if (events & READ) {
      // Read all available data, so EventBase will stop calling us
      // until new data becomes available
      bytesRead = readUntilEmpty(fd_);
    }
    if (events & WRITE) {
      // Write until the pipe buffer is full, so EventBase will stop calling
      // us until the other end has read some data
      bytesWritten = writeUntilFull(fd_);
    }

    log.emplace_back(events, bytesRead, bytesWritten);
  }

  struct EventRecord {
    EventRecord(uint16_t events_, size_t bytesRead_, size_t bytesWritten_)
        : events(events_),
          timestamp(),
          bytesRead(bytesRead_),
          bytesWritten(bytesWritten_) {}

    uint16_t events;
    TimePoint timestamp;
    ssize_t bytesRead;
    ssize_t bytesWritten;
  };

  deque<EventRecord> log;

 private:
  int fd_;
};

/**
 * Test a READ event
 */
TEST(EventBaseTest, ReadEvent) {
  EventBase eb;
  SocketPair sp;

  // Register for read events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::READ);

  // Register timeouts to perform two write events
  ScheduledEvent events[] = {
      {10, EventHandler::WRITE, 2345, 0},
      {160, EventHandler::WRITE, 99, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // Since we didn't use the EventHandler::PERSIST flag, the handler should
  // have received the first read, then unregistered itself.  Check that only
  // the first chunk of data was received.
  ASSERT_EQ(handler.log.size(), 1);
  ASSERT_EQ(handler.log[0].events, EventHandler::READ);
  T_CHECK_TIMEOUT(
      start,
      handler.log[0].timestamp,
      milliseconds(events[0].milliseconds),
      milliseconds(90));
  ASSERT_EQ(handler.log[0].bytesRead, events[0].length);
  ASSERT_EQ(handler.log[0].bytesWritten, 0);
  T_CHECK_TIMEOUT(
      start, end, milliseconds(events[1].milliseconds), milliseconds(30));

  // Make sure the second chunk of data is still waiting to be read.
  size_t bytesRemaining = readUntilEmpty(sp[0]);
  ASSERT_EQ(bytesRemaining, events[1].length);
}

/**
 * Test (READ | PERSIST)
 */
TEST(EventBaseTest, ReadPersist) {
  EventBase eb;
  SocketPair sp;

  // Register for read events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::READ | EventHandler::PERSIST);

  // Register several timeouts to perform writes
  ScheduledEvent events[] = {
      {10, EventHandler::WRITE, 1024, 0},
      {20, EventHandler::WRITE, 2211, 0},
      {30, EventHandler::WRITE, 4096, 0},
      {100, EventHandler::WRITE, 100, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Schedule a timeout to unregister the handler after the third write
  eb.tryRunAfterDelay(std::bind(&TestHandler::unregisterHandler, &handler), 85);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // The handler should have received the first 3 events,
  // then been unregistered after that.
  ASSERT_EQ(handler.log.size(), 3);
  for (int n = 0; n < 3; ++n) {
    ASSERT_EQ(handler.log[n].events, EventHandler::READ);
    T_CHECK_TIMEOUT(
        start, handler.log[n].timestamp, milliseconds(events[n].milliseconds));
    ASSERT_EQ(handler.log[n].bytesRead, events[n].length);
    ASSERT_EQ(handler.log[n].bytesWritten, 0);
  }
  T_CHECK_TIMEOUT(start, end, milliseconds(events[3].milliseconds));

  // Make sure the data from the last write is still waiting to be read
  size_t bytesRemaining = readUntilEmpty(sp[0]);
  ASSERT_EQ(bytesRemaining, events[3].length);
}

/**
 * Test registering for READ when the socket is immediately readable
 */
TEST(EventBaseTest, ReadImmediate) {
  EventBase eb;
  SocketPair sp;

  // Write some data to the socket so the other end will
  // be immediately readable
  size_t dataLength = 1234;
  writeToFD(sp[1], dataLength);

  // Register for read events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::READ | EventHandler::PERSIST);

  // Register a timeout to perform another write
  ScheduledEvent events[] = {
      {10, EventHandler::WRITE, 2345, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Schedule a timeout to unregister the handler
  eb.tryRunAfterDelay(std::bind(&TestHandler::unregisterHandler, &handler), 20);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  ASSERT_EQ(handler.log.size(), 2);

  // There should have been 1 event for immediate readability
  ASSERT_EQ(handler.log[0].events, EventHandler::READ);
  T_CHECK_TIMEOUT(start, handler.log[0].timestamp, milliseconds(0));
  ASSERT_EQ(handler.log[0].bytesRead, dataLength);
  ASSERT_EQ(handler.log[0].bytesWritten, 0);

  // There should be another event after the timeout wrote more data
  ASSERT_EQ(handler.log[1].events, EventHandler::READ);
  T_CHECK_TIMEOUT(
      start, handler.log[1].timestamp, milliseconds(events[0].milliseconds));
  ASSERT_EQ(handler.log[1].bytesRead, events[0].length);
  ASSERT_EQ(handler.log[1].bytesWritten, 0);

  T_CHECK_TIMEOUT(start, end, milliseconds(20));
}

/**
 * Test a WRITE event
 */
TEST(EventBaseTest, WriteEvent) {
  EventBase eb;
  SocketPair sp;

  // Fill up the write buffer before starting
  size_t initialBytesWritten = writeUntilFull(sp[0]);

  // Register for write events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::WRITE);

  // Register timeouts to perform two reads
  ScheduledEvent events[] = {
      {10, EventHandler::READ, 0, 0},
      {60, EventHandler::READ, 0, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // Since we didn't use the EventHandler::PERSIST flag, the handler should
  // have only been able to write once, then unregistered itself.
  ASSERT_EQ(handler.log.size(), 1);
  ASSERT_EQ(handler.log[0].events, EventHandler::WRITE);
  T_CHECK_TIMEOUT(
      start, handler.log[0].timestamp, milliseconds(events[0].milliseconds));
  ASSERT_EQ(handler.log[0].bytesRead, 0);
  ASSERT_GT(handler.log[0].bytesWritten, 0);
  T_CHECK_TIMEOUT(start, end, milliseconds(events[1].milliseconds));

  ASSERT_EQ(events[0].result, initialBytesWritten);
  ASSERT_EQ(events[1].result, handler.log[0].bytesWritten);
}

/**
 * Test (WRITE | PERSIST)
 */
TEST(EventBaseTest, WritePersist) {
  EventBase eb;
  SocketPair sp;

  // Fill up the write buffer before starting
  size_t initialBytesWritten = writeUntilFull(sp[0]);

  // Register for write events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::WRITE | EventHandler::PERSIST);

  // Register several timeouts to read from the socket at several intervals
  ScheduledEvent events[] = {
      {10, EventHandler::READ, 0, 0},
      {40, EventHandler::READ, 0, 0},
      {70, EventHandler::READ, 0, 0},
      {100, EventHandler::READ, 0, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Schedule a timeout to unregister the handler after the third read
  eb.tryRunAfterDelay(std::bind(&TestHandler::unregisterHandler, &handler), 85);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // The handler should have received the first 3 events,
  // then been unregistered after that.
  ASSERT_EQ(handler.log.size(), 3);
  ASSERT_EQ(events[0].result, initialBytesWritten);
  for (int n = 0; n < 3; ++n) {
    ASSERT_EQ(handler.log[n].events, EventHandler::WRITE);
    T_CHECK_TIMEOUT(
        start, handler.log[n].timestamp, milliseconds(events[n].milliseconds));
    ASSERT_EQ(handler.log[n].bytesRead, 0);
    ASSERT_GT(handler.log[n].bytesWritten, 0);
    ASSERT_EQ(handler.log[n].bytesWritten, events[n + 1].result);
  }
  T_CHECK_TIMEOUT(start, end, milliseconds(events[3].milliseconds));
}

/**
 * Test registering for WRITE when the socket is immediately writable
 */
TEST(EventBaseTest, WriteImmediate) {
  EventBase eb;
  SocketPair sp;

  // Register for write events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::WRITE | EventHandler::PERSIST);

  // Register a timeout to perform a read
  ScheduledEvent events[] = {
      {10, EventHandler::READ, 0, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Schedule a timeout to unregister the handler
  int64_t unregisterTimeout = 40;
  eb.tryRunAfterDelay(
      std::bind(&TestHandler::unregisterHandler, &handler), unregisterTimeout);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  ASSERT_EQ(handler.log.size(), 2);

  // Since the socket buffer was initially empty,
  // there should have been 1 event for immediate writability
  ASSERT_EQ(handler.log[0].events, EventHandler::WRITE);
  T_CHECK_TIMEOUT(start, handler.log[0].timestamp, milliseconds(0));
  ASSERT_EQ(handler.log[0].bytesRead, 0);
  ASSERT_GT(handler.log[0].bytesWritten, 0);

  // There should be another event after the timeout wrote more data
  ASSERT_EQ(handler.log[1].events, EventHandler::WRITE);
  T_CHECK_TIMEOUT(
      start, handler.log[1].timestamp, milliseconds(events[0].milliseconds));
  ASSERT_EQ(handler.log[1].bytesRead, 0);
  ASSERT_GT(handler.log[1].bytesWritten, 0);

  T_CHECK_TIMEOUT(start, end, milliseconds(unregisterTimeout));
}

/**
 * Test (READ | WRITE) when the socket becomes readable first
 */
TEST(EventBaseTest, ReadWrite) {
  EventBase eb;
  SocketPair sp;

  // Fill up the write buffer before starting
  size_t sock0WriteLength = writeUntilFull(sp[0]);

  // Register for read and write events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::READ_WRITE);

  // Register timeouts to perform a write then a read.
  ScheduledEvent events[] = {
      {10, EventHandler::WRITE, 2345, 0},
      {40, EventHandler::READ, 0, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // Since we didn't use the EventHandler::PERSIST flag, the handler should
  // have only noticed readability, then unregistered itself.  Check that only
  // one event was logged.
  ASSERT_EQ(handler.log.size(), 1);
  ASSERT_EQ(handler.log[0].events, EventHandler::READ);
  T_CHECK_TIMEOUT(
      start, handler.log[0].timestamp, milliseconds(events[0].milliseconds));
  ASSERT_EQ(handler.log[0].bytesRead, events[0].length);
  ASSERT_EQ(handler.log[0].bytesWritten, 0);
  ASSERT_EQ(events[1].result, sock0WriteLength);
  T_CHECK_TIMEOUT(start, end, milliseconds(events[1].milliseconds));
}

/**
 * Test (READ | WRITE) when the socket becomes writable first
 */
TEST(EventBaseTest, WriteRead) {
  EventBase eb;
  SocketPair sp;

  // Fill up the write buffer before starting
  size_t sock0WriteLength = writeUntilFull(sp[0]);

  // Register for read and write events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::READ_WRITE);

  // Register timeouts to perform a read then a write.
  size_t sock1WriteLength = 2345;
  ScheduledEvent events[] = {
      {10, EventHandler::READ, 0, 0},
      {40, EventHandler::WRITE, sock1WriteLength, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // Since we didn't use the EventHandler::PERSIST flag, the handler should
  // have only noticed writability, then unregistered itself.  Check that only
  // one event was logged.
  ASSERT_EQ(handler.log.size(), 1);
  ASSERT_EQ(handler.log[0].events, EventHandler::WRITE);
  T_CHECK_TIMEOUT(
      start, handler.log[0].timestamp, milliseconds(events[0].milliseconds));
  ASSERT_EQ(handler.log[0].bytesRead, 0);
  ASSERT_GT(handler.log[0].bytesWritten, 0);
  ASSERT_EQ(events[0].result, sock0WriteLength);
  ASSERT_EQ(events[1].result, sock1WriteLength);
  T_CHECK_TIMEOUT(start, end, milliseconds(events[1].milliseconds));

  // Make sure the written data is still waiting to be read.
  size_t bytesRemaining = readUntilEmpty(sp[0]);
  ASSERT_EQ(bytesRemaining, events[1].length);
}

/**
 * Test (READ | WRITE) when the socket becomes readable and writable
 * at the same time.
 */
TEST(EventBaseTest, ReadWriteSimultaneous) {
  EventBase eb;
  SocketPair sp;

  // Fill up the write buffer before starting
  size_t sock0WriteLength = writeUntilFull(sp[0]);

  // Register for read and write events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(EventHandler::READ_WRITE);

  // Register a timeout to perform a read and write together
  ScheduledEvent events[] = {
      {10, EventHandler::READ | EventHandler::WRITE, 0, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // It's not strictly required that the EventBase register us about both
  // events in the same call.  So, it's possible that if the EventBase
  // implementation changes this test could start failing, and it wouldn't be
  // considered breaking the API.  However for now it's nice to exercise this
  // code path.
  ASSERT_EQ(handler.log.size(), 1);
  ASSERT_EQ(handler.log[0].events, EventHandler::READ | EventHandler::WRITE);
  T_CHECK_TIMEOUT(
      start, handler.log[0].timestamp, milliseconds(events[0].milliseconds));
  ASSERT_EQ(handler.log[0].bytesRead, sock0WriteLength);
  ASSERT_GT(handler.log[0].bytesWritten, 0);
  T_CHECK_TIMEOUT(start, end, milliseconds(events[0].milliseconds));
}

/**
 * Test (READ | WRITE | PERSIST)
 */
TEST(EventBaseTest, ReadWritePersist) {
  EventBase eb;
  SocketPair sp;

  // Register for read and write events
  TestHandler handler(&eb, sp[0]);
  handler.registerHandler(
      EventHandler::READ | EventHandler::WRITE | EventHandler::PERSIST);

  // Register timeouts to perform several reads and writes
  ScheduledEvent events[] = {
      {10, EventHandler::WRITE, 2345, 0},
      {20, EventHandler::READ, 0, 0},
      {35, EventHandler::WRITE, 200, 0},
      {45, EventHandler::WRITE, 15, 0},
      {55, EventHandler::READ, 0, 0},
      {120, EventHandler::WRITE, 2345, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Schedule a timeout to unregister the handler
  eb.tryRunAfterDelay(std::bind(&TestHandler::unregisterHandler, &handler), 80);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  ASSERT_EQ(handler.log.size(), 6);

  // Since we didn't fill up the write buffer immediately, there should
  // be an immediate event for writability.
  ASSERT_EQ(handler.log[0].events, EventHandler::WRITE);
  T_CHECK_TIMEOUT(start, handler.log[0].timestamp, milliseconds(0));
  ASSERT_EQ(handler.log[0].bytesRead, 0);
  ASSERT_GT(handler.log[0].bytesWritten, 0);

  // Events 1 through 5 should correspond to the scheduled events
  for (int n = 1; n < 6; ++n) {
    ScheduledEvent* event = &events[n - 1];
    T_CHECK_TIMEOUT(
        start, handler.log[n].timestamp, milliseconds(event->milliseconds));
    if (event->events == EventHandler::READ) {
      ASSERT_EQ(handler.log[n].events, EventHandler::WRITE);
      ASSERT_EQ(handler.log[n].bytesRead, 0);
      ASSERT_GT(handler.log[n].bytesWritten, 0);
    } else {
      ASSERT_EQ(handler.log[n].events, EventHandler::READ);
      ASSERT_EQ(handler.log[n].bytesRead, event->length);
      ASSERT_EQ(handler.log[n].bytesWritten, 0);
    }
  }

  // The timeout should have unregistered the handler before the last write.
  // Make sure that data is still waiting to be read
  size_t bytesRemaining = readUntilEmpty(sp[0]);
  ASSERT_EQ(bytesRemaining, events[5].length);
}

class PartialReadHandler : public TestHandler {
 public:
  PartialReadHandler(EventBase* eventBase, int fd, size_t readLength)
      : TestHandler(eventBase, fd), fd_(fd), readLength_(readLength) {}

  void handlerReady(uint16_t events) noexcept override {
    assert(events == EventHandler::READ);
    ssize_t bytesRead = readFromFD(fd_, readLength_);
    log.emplace_back(events, bytesRead, 0);
  }

 private:
  int fd_;
  size_t readLength_;
};

/**
 * Test reading only part of the available data when a read event is fired.
 * When PERSIST is used, make sure the handler gets notified again the next
 * time around the loop.
 */
TEST(EventBaseTest, ReadPartial) {
  EventBase eb;
  SocketPair sp;

  // Register for read events
  size_t readLength = 100;
  PartialReadHandler handler(&eb, sp[0], readLength);
  handler.registerHandler(EventHandler::READ | EventHandler::PERSIST);

  // Register a timeout to perform a single write,
  // with more data than PartialReadHandler will read at once
  ScheduledEvent events[] = {
      {10, EventHandler::WRITE, (3 * readLength) + (readLength / 2), 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Schedule a timeout to unregister the handler
  eb.tryRunAfterDelay(std::bind(&TestHandler::unregisterHandler, &handler), 30);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  ASSERT_EQ(handler.log.size(), 4);

  // The first 3 invocations should read readLength bytes each
  for (int n = 0; n < 3; ++n) {
    ASSERT_EQ(handler.log[n].events, EventHandler::READ);
    T_CHECK_TIMEOUT(
        start, handler.log[n].timestamp, milliseconds(events[0].milliseconds));
    ASSERT_EQ(handler.log[n].bytesRead, readLength);
    ASSERT_EQ(handler.log[n].bytesWritten, 0);
  }
  // The last read only has readLength/2 bytes
  ASSERT_EQ(handler.log[3].events, EventHandler::READ);
  T_CHECK_TIMEOUT(
      start, handler.log[3].timestamp, milliseconds(events[0].milliseconds));
  ASSERT_EQ(handler.log[3].bytesRead, readLength / 2);
  ASSERT_EQ(handler.log[3].bytesWritten, 0);
}

class PartialWriteHandler : public TestHandler {
 public:
  PartialWriteHandler(EventBase* eventBase, int fd, size_t writeLength)
      : TestHandler(eventBase, fd), fd_(fd), writeLength_(writeLength) {}

  void handlerReady(uint16_t events) noexcept override {
    assert(events == EventHandler::WRITE);
    ssize_t bytesWritten = writeToFD(fd_, writeLength_);
    log.emplace_back(events, 0, bytesWritten);
  }

 private:
  int fd_;
  size_t writeLength_;
};

/**
 * Test writing without completely filling up the write buffer when the fd
 * becomes writable.  When PERSIST is used, make sure the handler gets
 * notified again the next time around the loop.
 */
TEST(EventBaseTest, WritePartial) {
  EventBase eb;
  SocketPair sp;

  // Fill up the write buffer before starting
  size_t initialBytesWritten = writeUntilFull(sp[0]);

  // Register for write events
  size_t writeLength = 100;
  PartialWriteHandler handler(&eb, sp[0], writeLength);
  handler.registerHandler(EventHandler::WRITE | EventHandler::PERSIST);

  // Register a timeout to read, so that more data can be written
  ScheduledEvent events[] = {
      {10, EventHandler::READ, 0, 0},
      {0, 0, 0, 0},
  };
  scheduleEvents(&eb, sp[1], events);

  // Schedule a timeout to unregister the handler
  eb.tryRunAfterDelay(std::bind(&TestHandler::unregisterHandler, &handler), 30);

  // Loop
  TimePoint start;
  eb.loop();
  TimePoint end;

  // Depending on how big the socket buffer is, there will be multiple writes
  // Only check the first 5
  int numChecked = 5;
  ASSERT_GE(handler.log.size(), numChecked);
  ASSERT_EQ(events[0].result, initialBytesWritten);

  // The first 3 invocations should read writeLength bytes each
  for (int n = 0; n < numChecked; ++n) {
    ASSERT_EQ(handler.log[n].events, EventHandler::WRITE);
    T_CHECK_TIMEOUT(
        start, handler.log[n].timestamp, milliseconds(events[0].milliseconds));
    ASSERT_EQ(handler.log[n].bytesRead, 0);
    ASSERT_EQ(handler.log[n].bytesWritten, writeLength);
  }
}

/**
 * Test destroying a registered EventHandler
 */
TEST(EventBaseTest, DestroyHandler) {
  class DestroyHandler : public AsyncTimeout {
   public:
    DestroyHandler(EventBase* eb, EventHandler* h)
        : AsyncTimeout(eb), handler_(h) {}

    void timeoutExpired() noexcept override {
      delete handler_;
    }

   private:
    EventHandler* handler_;
  };

  EventBase eb;
  SocketPair sp;

  // Fill up the write buffer before starting
  size_t initialBytesWritten = writeUntilFull(sp[0]);

  // Register for write events
  TestHandler* handler = new TestHandler(&eb, sp[0]);
  handler->registerHandler(EventHandler::WRITE | EventHandler::PERSIST);

  // After 10ms, read some data, so that the handler
  // will be notified that it can write.
  eb.tryRunAfterDelay(
      std::bind(checkReadUntilEmpty, sp[1], initialBytesWritten), 10);

  // Start a timer to destroy the handler after 25ms
  // This mainly just makes sure the code doesn't break or assert
  DestroyHandler dh(&eb, handler);
  dh.scheduleTimeout(25);

  TimePoint start;
  eb.loop();
  TimePoint end;

  // Make sure the EventHandler was uninstalled properly when it was
  // destroyed, and the EventBase loop exited
  T_CHECK_TIMEOUT(start, end, milliseconds(25));

  // Make sure that the handler wrote data to the socket
  // before it was destroyed
  size_t bytesRemaining = readUntilEmpty(sp[1]);
  ASSERT_GT(bytesRemaining, 0);
}

///////////////////////////////////////////////////////////////////////////
// Tests for timeout events
///////////////////////////////////////////////////////////////////////////

TEST(EventBaseTest, RunAfterDelay) {
  EventBase eb;

  TimePoint timestamp1(false);
  TimePoint timestamp2(false);
  TimePoint timestamp3(false);
  eb.tryRunAfterDelay(std::bind(&TimePoint::reset, &timestamp1), 10);
  eb.tryRunAfterDelay(std::bind(&TimePoint::reset, &timestamp2), 20);
  eb.tryRunAfterDelay(std::bind(&TimePoint::reset, &timestamp3), 40);

  TimePoint start;
  eb.loop();
  TimePoint end;

  T_CHECK_TIMEOUT(start, timestamp1, milliseconds(10));
  T_CHECK_TIMEOUT(start, timestamp2, milliseconds(20));
  T_CHECK_TIMEOUT(start, timestamp3, milliseconds(40));
  T_CHECK_TIMEOUT(start, end, milliseconds(40));
}

/**
 * Test the behavior of tryRunAfterDelay() when some timeouts are
 * still scheduled when the EventBase is destroyed.
 */
TEST(EventBaseTest, RunAfterDelayDestruction) {
  TimePoint timestamp1(false);
  TimePoint timestamp2(false);
  TimePoint timestamp3(false);
  TimePoint timestamp4(false);
  TimePoint start(false);
  TimePoint end(false);

  {
    EventBase eb;

    // Run two normal timeouts
    eb.tryRunAfterDelay(std::bind(&TimePoint::reset, &timestamp1), 10);
    eb.tryRunAfterDelay(std::bind(&TimePoint::reset, &timestamp2), 20);

    // Schedule a timeout to stop the event loop after 40ms
    eb.tryRunAfterDelay(std::bind(&EventBase::terminateLoopSoon, &eb), 40);

    // Schedule 2 timeouts that would fire after the event loop stops
    eb.tryRunAfterDelay(std::bind(&TimePoint::reset, &timestamp3), 80);
    eb.tryRunAfterDelay(std::bind(&TimePoint::reset, &timestamp4), 160);

    start.reset();
    eb.loop();
    end.reset();
  }

  T_CHECK_TIMEOUT(start, timestamp1, milliseconds(10));
  T_CHECK_TIMEOUT(start, timestamp2, milliseconds(20));
  T_CHECK_TIMEOUT(start, end, milliseconds(40));

  ASSERT_TRUE(timestamp3.isUnset());
  ASSERT_TRUE(timestamp4.isUnset());

  // Ideally this test should be run under valgrind to ensure that no
  // memory is leaked.
}

class TestTimeout : public AsyncTimeout {
 public:
  explicit TestTimeout(EventBase* eventBase)
      : AsyncTimeout(eventBase), timestamp(false) {}

  void timeoutExpired() noexcept override {
    timestamp.reset();
  }

  TimePoint timestamp;
};

TEST(EventBaseTest, BasicTimeouts) {
  EventBase eb;

  TestTimeout t1(&eb);
  TestTimeout t2(&eb);
  TestTimeout t3(&eb);
  t1.scheduleTimeout(10);
  t2.scheduleTimeout(20);
  t3.scheduleTimeout(40);

  TimePoint start;
  eb.loop();
  TimePoint end;

  T_CHECK_TIMEOUT(start, t1.timestamp, milliseconds(10));
  T_CHECK_TIMEOUT(start, t2.timestamp, milliseconds(20));
  T_CHECK_TIMEOUT(start, t3.timestamp, milliseconds(40));
  T_CHECK_TIMEOUT(start, end, milliseconds(40));
}

class ReschedulingTimeout : public AsyncTimeout {
 public:
  ReschedulingTimeout(EventBase* evb, const vector<uint32_t>& timeouts)
      : AsyncTimeout(evb), timeouts_(timeouts), iterator_(timeouts_.begin()) {}

  void start() {
    reschedule();
  }

  void timeoutExpired() noexcept override {
    timestamps.emplace_back();
    reschedule();
  }

  void reschedule() {
    if (iterator_ != timeouts_.end()) {
      uint32_t timeout = *iterator_;
      ++iterator_;
      scheduleTimeout(timeout);
    }
  }

  vector<TimePoint> timestamps;

 private:
  vector<uint32_t> timeouts_;
  vector<uint32_t>::const_iterator iterator_;
};

/**
 * Test rescheduling the same timeout multiple times
 */
TEST(EventBaseTest, ReuseTimeout) {
  EventBase eb;

  vector<uint32_t> timeouts;
  timeouts.push_back(10);
  timeouts.push_back(30);
  timeouts.push_back(15);

  ReschedulingTimeout t(&eb, timeouts);
  t.start();

  TimePoint start;
  eb.loop();
  TimePoint end;

  // Use a higher tolerance than usual.  We're waiting on 3 timeouts
  // consecutively.  In general, each timeout may go over by a few
  // milliseconds, and we're tripling this error by witing on 3 timeouts.
  milliseconds tolerance{6};

  ASSERT_EQ(timeouts.size(), t.timestamps.size());
  uint32_t total = 0;
  for (size_t n = 0; n < timeouts.size(); ++n) {
    total += timeouts[n];
    T_CHECK_TIMEOUT(start, t.timestamps[n], milliseconds(total), tolerance);
  }
  T_CHECK_TIMEOUT(start, end, milliseconds(total), tolerance);
}

/**
 * Test rescheduling a timeout before it has fired
 */
TEST(EventBaseTest, RescheduleTimeout) {
  EventBase eb;

  TestTimeout t1(&eb);
  TestTimeout t2(&eb);
  TestTimeout t3(&eb);

  t1.scheduleTimeout(15);
  t2.scheduleTimeout(30);
  t3.scheduleTimeout(30);

  auto f = static_cast<bool (AsyncTimeout::*)(uint32_t)>(
      &AsyncTimeout::scheduleTimeout);

  // after 10ms, reschedule t2 to run sooner than originally scheduled
  eb.tryRunAfterDelay(std::bind(f, &t2, 10), 10);
  // after 10ms, reschedule t3 to run later than originally scheduled
  eb.tryRunAfterDelay(std::bind(f, &t3, 40), 10);

  TimePoint start;
  eb.loop();
  TimePoint end;

  T_CHECK_TIMEOUT(start, t1.timestamp, milliseconds(15));
  T_CHECK_TIMEOUT(start, t2.timestamp, milliseconds(20));
  T_CHECK_TIMEOUT(start, t3.timestamp, milliseconds(50));
  T_CHECK_TIMEOUT(start, end, milliseconds(50));
}

/**
 * Test cancelling a timeout
 */
TEST(EventBaseTest, CancelTimeout) {
  EventBase eb;

  vector<uint32_t> timeouts;
  timeouts.push_back(10);
  timeouts.push_back(30);
  timeouts.push_back(25);

  ReschedulingTimeout t(&eb, timeouts);
  t.start();
  eb.tryRunAfterDelay(std::bind(&AsyncTimeout::cancelTimeout, &t), 50);

  TimePoint start;
  eb.loop();
  TimePoint end;

  ASSERT_EQ(t.timestamps.size(), 2);
  T_CHECK_TIMEOUT(start, t.timestamps[0], milliseconds(10));
  T_CHECK_TIMEOUT(start, t.timestamps[1], milliseconds(40));
  T_CHECK_TIMEOUT(start, end, milliseconds(50));
}

/**
 * Test destroying a scheduled timeout object
 */
TEST(EventBaseTest, DestroyTimeout) {
  class DestroyTimeout : public AsyncTimeout {
   public:
    DestroyTimeout(EventBase* eb, AsyncTimeout* t)
        : AsyncTimeout(eb), timeout_(t) {}

    void timeoutExpired() noexcept override {
      delete timeout_;
    }

   private:
    AsyncTimeout* timeout_;
  };

  EventBase eb;

  TestTimeout* t1 = new TestTimeout(&eb);
  t1->scheduleTimeout(30);

  DestroyTimeout dt(&eb, t1);
  dt.scheduleTimeout(10);

  TimePoint start;
  eb.loop();
  TimePoint end;

  T_CHECK_TIMEOUT(start, end, milliseconds(10));
}

/**
 * Test the scheduled executor impl
 */
TEST(EventBaseTest, ScheduledFn) {
  EventBase eb;

  TimePoint timestamp1(false);
  TimePoint timestamp2(false);
  TimePoint timestamp3(false);
  eb.schedule(std::bind(&TimePoint::reset, &timestamp1), milliseconds(9));
  eb.schedule(std::bind(&TimePoint::reset, &timestamp2), milliseconds(19));
  eb.schedule(std::bind(&TimePoint::reset, &timestamp3), milliseconds(39));

  TimePoint start;
  eb.loop();
  TimePoint end;

  T_CHECK_TIMEOUT(start, timestamp1, milliseconds(9));
  T_CHECK_TIMEOUT(start, timestamp2, milliseconds(19));
  T_CHECK_TIMEOUT(start, timestamp3, milliseconds(39));
  T_CHECK_TIMEOUT(start, end, milliseconds(39));
}

TEST(EventBaseTest, ScheduledFnAt) {
  EventBase eb;

  TimePoint timestamp0(false);
  TimePoint timestamp1(false);
  TimePoint timestamp2(false);
  TimePoint timestamp3(false);
  eb.scheduleAt(
      std::bind(&TimePoint::reset, &timestamp1), eb.now() - milliseconds(5));
  eb.scheduleAt(
      std::bind(&TimePoint::reset, &timestamp1), eb.now() + milliseconds(9));
  eb.scheduleAt(
      std::bind(&TimePoint::reset, &timestamp2), eb.now() + milliseconds(19));
  eb.scheduleAt(
      std::bind(&TimePoint::reset, &timestamp3), eb.now() + milliseconds(39));

  TimePoint start;
  eb.loop();
  TimePoint end;

  T_CHECK_TIME_LT(start, timestamp0, milliseconds(0));
  T_CHECK_TIMEOUT(start, timestamp1, milliseconds(9));
  T_CHECK_TIMEOUT(start, timestamp2, milliseconds(19));
  T_CHECK_TIMEOUT(start, timestamp3, milliseconds(39));
  T_CHECK_TIMEOUT(start, end, milliseconds(39));
}

///////////////////////////////////////////////////////////////////////////
// Test for runInThreadTestFunc()
///////////////////////////////////////////////////////////////////////////

struct RunInThreadData {
  RunInThreadData(int numThreads, int opsPerThread_)
      : opsPerThread(opsPerThread_), opsToGo(numThreads * opsPerThread) {}

  EventBase evb;
  deque<pair<int, int>> values;

  int opsPerThread;
  int opsToGo;
};

struct RunInThreadArg {
  RunInThreadArg(RunInThreadData* data_, int threadId, int value_)
      : data(data_), thread(threadId), value(value_) {}

  RunInThreadData* data;
  int thread;
  int value;
};

void runInThreadTestFunc(RunInThreadArg* arg) {
  arg->data->values.emplace_back(arg->thread, arg->value);
  RunInThreadData* data = arg->data;
  delete arg;

  if (--data->opsToGo == 0) {
    // Break out of the event base loop if we are the last thread running
    data->evb.terminateLoopSoon();
  }
}

TEST(EventBaseTest, RunInThread) {
  constexpr uint32_t numThreads = 50;
  constexpr uint32_t opsPerThread = 100;
  RunInThreadData data(numThreads, opsPerThread);

  deque<std::thread> threads;
  SCOPE_EXIT {
    // Wait on all of the threads.
    for (auto& thread : threads) {
      thread.join();
    }
  };

  for (uint32_t i = 0; i < numThreads; ++i) {
    threads.emplace_back([i, &data] {
      for (int n = 0; n < data.opsPerThread; ++n) {
        RunInThreadArg* arg = new RunInThreadArg(&data, i, n);
        data.evb.runInEventBaseThread(runInThreadTestFunc, arg);
        usleep(10);
      }
    });
  }

  // Add a timeout event to run after 3 seconds.
  // Otherwise loop() will return immediately since there are no events to run.
  // Once the last thread exits, it will stop the loop().  However, this
  // timeout also stops the loop in case there is a bug performing the normal
  // stop.
  data.evb.tryRunAfterDelay(
      std::bind(&EventBase::terminateLoopSoon, &data.evb), 3000);

  TimePoint start;
  data.evb.loop();
  TimePoint end;

  // Verify that the loop exited because all threads finished and requested it
  // to stop.  This should happen much sooner than the 3 second timeout.
  // Assert that it happens in under a second.  (This is still tons of extra
  // padding.)

  auto timeTaken =
      std::chrono::duration_cast<milliseconds>(end.getTime() - start.getTime());
  ASSERT_LT(timeTaken.count(), 1000);
  VLOG(11) << "Time taken: " << timeTaken.count();

  // Verify that we have all of the events from every thread
  int expectedValues[numThreads];
  for (uint32_t n = 0; n < numThreads; ++n) {
    expectedValues[n] = 0;
  }
  for (deque<pair<int, int>>::const_iterator it = data.values.begin();
       it != data.values.end();
       ++it) {
    int threadID = it->first;
    int value = it->second;
    ASSERT_EQ(expectedValues[threadID], value);
    ++expectedValues[threadID];
  }
  for (uint32_t n = 0; n < numThreads; ++n) {
    ASSERT_EQ(expectedValues[n], opsPerThread);
  }
}

//  This test simulates some calls, and verifies that the waiting happens by
//  triggering what otherwise would be race conditions, and trying to detect
//  whether any of the race conditions happened.
TEST(EventBaseTest, RunInEventBaseThreadAndWait) {
  const size_t c = 256;
  vector<unique_ptr<atomic<size_t>>> atoms(c);
  for (size_t i = 0; i < c; ++i) {
    auto& atom = atoms.at(i);
    atom = std::make_unique<atomic<size_t>>(0);
  }
  vector<thread> threads;
  for (size_t i = 0; i < c; ++i) {
    threads.emplace_back([&atoms, i] {
      EventBase eb;
      auto& atom = *atoms.at(i);
      auto ebth = thread([&] { eb.loopForever(); });
      eb.waitUntilRunning();
      eb.runInEventBaseThreadAndWait([&] {
        size_t x = 0;
        atom.compare_exchange_weak(
            x, 1, std::memory_order_release, std::memory_order_relaxed);
      });
      size_t x = 0;
      atom.compare_exchange_weak(
          x, 2, std::memory_order_release, std::memory_order_relaxed);
      eb.terminateLoopSoon();
      ebth.join();
    });
  }
  for (size_t i = 0; i < c; ++i) {
    auto& th = threads.at(i);
    th.join();
  }
  size_t sum = 0;
  for (auto& atom : atoms) {
    sum += *atom;
  }
  EXPECT_EQ(c, sum);
}

TEST(EventBaseTest, RunImmediatelyOrRunInEventBaseThreadAndWaitCross) {
  EventBase eb;
  thread th(&EventBase::loopForever, &eb);
  SCOPE_EXIT {
    eb.terminateLoopSoon();
    th.join();
  };
  auto mutated = false;
  eb.runImmediatelyOrRunInEventBaseThreadAndWait([&] { mutated = true; });
  EXPECT_TRUE(mutated);
}

TEST(EventBaseTest, RunImmediatelyOrRunInEventBaseThreadAndWaitWithin) {
  EventBase eb;
  thread th(&EventBase::loopForever, &eb);
  SCOPE_EXIT {
    eb.terminateLoopSoon();
    th.join();
  };
  eb.runInEventBaseThreadAndWait([&] {
    auto mutated = false;
    eb.runImmediatelyOrRunInEventBaseThreadAndWait([&] { mutated = true; });
    EXPECT_TRUE(mutated);
  });
}

TEST(EventBaseTest, RunImmediatelyOrRunInEventBaseThreadNotLooping) {
  EventBase eb;
  auto mutated = false;
  eb.runImmediatelyOrRunInEventBaseThreadAndWait([&] { mutated = true; });
  EXPECT_TRUE(mutated);
}

///////////////////////////////////////////////////////////////////////////
// Tests for runInLoop()
///////////////////////////////////////////////////////////////////////////

class CountedLoopCallback : public EventBase::LoopCallback {
 public:
  CountedLoopCallback(
      EventBase* eventBase,
      unsigned int count,
      std::function<void()> action = std::function<void()>())
      : eventBase_(eventBase), count_(count), action_(action) {}

  void runLoopCallback() noexcept override {
    --count_;
    if (count_ > 0) {
      eventBase_->runInLoop(this);
    } else if (action_) {
      action_();
    }
  }

  unsigned int getCount() const {
    return count_;
  }

 private:
  EventBase* eventBase_;
  unsigned int count_;
  std::function<void()> action_;
};

// Test that EventBase::loop() doesn't exit while there are
// still LoopCallbacks remaining to be invoked.
TEST(EventBaseTest, RepeatedRunInLoop) {
  EventBase eventBase;

  CountedLoopCallback c(&eventBase, 10);
  eventBase.runInLoop(&c);
  // The callback shouldn't have run immediately
  ASSERT_EQ(c.getCount(), 10);
  eventBase.loop();

  // loop() should loop until the CountedLoopCallback stops
  // re-installing itself.
  ASSERT_EQ(c.getCount(), 0);
}

// Test that EventBase::loop() works as expected without time measurements.
TEST(EventBaseTest, RunInLoopNoTimeMeasurement) {
  EventBase eventBase(false);

  CountedLoopCallback c(&eventBase, 10);
  eventBase.runInLoop(&c);
  // The callback shouldn't have run immediately
  ASSERT_EQ(c.getCount(), 10);
  eventBase.loop();

  // loop() should loop until the CountedLoopCallback stops
  // re-installing itself.
  ASSERT_EQ(c.getCount(), 0);
}

// Test runInLoop() calls with terminateLoopSoon()
TEST(EventBaseTest, RunInLoopStopLoop) {
  EventBase eventBase;

  CountedLoopCallback c1(&eventBase, 20);
  CountedLoopCallback c2(
      &eventBase, 10, std::bind(&EventBase::terminateLoopSoon, &eventBase));

  eventBase.runInLoop(&c1);
  eventBase.runInLoop(&c2);
  ASSERT_EQ(c1.getCount(), 20);
  ASSERT_EQ(c2.getCount(), 10);

  eventBase.loopForever();

  // c2 should have stopped the loop after 10 iterations
  ASSERT_EQ(c2.getCount(), 0);

  // We allow the EventBase to run the loop callbacks in whatever order it
  // chooses.  We'll accept c1's count being either 10 (if the loop terminated
  // after c1 ran on the 10th iteration) or 11 (if c2 terminated the loop
  // before c1 ran).
  //
  // (With the current code, c1 will always run 10 times, but we don't consider
  // this a hard API requirement.)
  ASSERT_GE(c1.getCount(), 10);
  ASSERT_LE(c1.getCount(), 11);
}

TEST(EventBaseTest, messageAvailableException) {
  auto deadManWalking = [] {
    EventBase eventBase;
    std::thread t([&] {
      // Call this from another thread to force use of NotificationQueue in
      // runInEventBaseThread
      eventBase.runInEventBaseThread(
          []() { throw std::runtime_error("boom"); });
    });
    t.join();
    eventBase.loopForever();
  };
  EXPECT_DEATH(deadManWalking(), ".*");
}

TEST(EventBaseTest, TryRunningAfterTerminate) {
  EventBase eventBase;
  CountedLoopCallback c1(
      &eventBase, 1, std::bind(&EventBase::terminateLoopSoon, &eventBase));
  eventBase.runInLoop(&c1);
  eventBase.loopForever();
  bool ran = false;
  eventBase.runInEventBaseThread([&]() { ran = true; });

  ASSERT_FALSE(ran);
}

// Test cancelling runInLoop() callbacks
TEST(EventBaseTest, CancelRunInLoop) {
  EventBase eventBase;

  CountedLoopCallback c1(&eventBase, 20);
  CountedLoopCallback c2(&eventBase, 20);
  CountedLoopCallback c3(&eventBase, 20);

  std::function<void()> cancelC1Action =
      std::bind(&EventBase::LoopCallback::cancelLoopCallback, &c1);
  std::function<void()> cancelC2Action =
      std::bind(&EventBase::LoopCallback::cancelLoopCallback, &c2);

  CountedLoopCallback cancelC1(&eventBase, 10, cancelC1Action);
  CountedLoopCallback cancelC2(&eventBase, 10, cancelC2Action);

  // Install cancelC1 after c1
  eventBase.runInLoop(&c1);
  eventBase.runInLoop(&cancelC1);

  // Install cancelC2 before c2
  eventBase.runInLoop(&cancelC2);
  eventBase.runInLoop(&c2);

  // Install c3
  eventBase.runInLoop(&c3);

  ASSERT_EQ(c1.getCount(), 20);
  ASSERT_EQ(c2.getCount(), 20);
  ASSERT_EQ(c3.getCount(), 20);
  ASSERT_EQ(cancelC1.getCount(), 10);
  ASSERT_EQ(cancelC2.getCount(), 10);

  // Run the loop
  eventBase.loop();

  // cancelC1 and cancelC2 should have both fired after 10 iterations and
  // stopped re-installing themselves
  ASSERT_EQ(cancelC1.getCount(), 0);
  ASSERT_EQ(cancelC2.getCount(), 0);
  // c3 should have continued on for the full 20 iterations
  ASSERT_EQ(c3.getCount(), 0);

  // c1 and c2 should have both been cancelled on the 10th iteration.
  //
  // Callbacks are always run in the order they are installed,
  // so c1 should have fired 10 times, and been canceled after it ran on the
  // 10th iteration.  c2 should have only fired 9 times, because cancelC2 will
  // have run before it on the 10th iteration, and cancelled it before it
  // fired.
  ASSERT_EQ(c1.getCount(), 10);
  ASSERT_EQ(c2.getCount(), 11);
}

class TerminateTestCallback : public EventBase::LoopCallback,
                              public EventHandler {
 public:
  TerminateTestCallback(EventBase* eventBase, int fd)
      : EventHandler(eventBase, fd),
        eventBase_(eventBase),
        loopInvocations_(0),
        maxLoopInvocations_(0),
        eventInvocations_(0),
        maxEventInvocations_(0) {}

  void reset(uint32_t maxLoopInvocations, uint32_t maxEventInvocations) {
    loopInvocations_ = 0;
    maxLoopInvocations_ = maxLoopInvocations;
    eventInvocations_ = 0;
    maxEventInvocations_ = maxEventInvocations;

    cancelLoopCallback();
    unregisterHandler();
  }

  void handlerReady(uint16_t /* events */) noexcept override {
    // We didn't register with PERSIST, so we will have been automatically
    // unregistered already.
    ASSERT_FALSE(isHandlerRegistered());

    ++eventInvocations_;
    if (eventInvocations_ >= maxEventInvocations_) {
      return;
    }

    eventBase_->runInLoop(this);
  }
  void runLoopCallback() noexcept override {
    ++loopInvocations_;
    if (loopInvocations_ >= maxLoopInvocations_) {
      return;
    }

    registerHandler(READ);
  }

  uint32_t getLoopInvocations() const {
    return loopInvocations_;
  }
  uint32_t getEventInvocations() const {
    return eventInvocations_;
  }

 private:
  EventBase* eventBase_;
  uint32_t loopInvocations_;
  uint32_t maxLoopInvocations_;
  uint32_t eventInvocations_;
  uint32_t maxEventInvocations_;
};

/**
 * Test that EventBase::loop() correctly detects when there are no more events
 * left to run.
 *
 * This uses a single callback, which alternates registering itself as a loop
 * callback versus a EventHandler callback.  This exercises a regression where
 * EventBase::loop() incorrectly exited if there were no more fd handlers
 * registered, but a loop callback installed a new fd handler.
 */
TEST(EventBaseTest, LoopTermination) {
  EventBase eventBase;

  // Open a pipe and close the write end,
  // so the read endpoint will be readable
  int pipeFds[2];
  int rc = pipe(pipeFds);
  ASSERT_EQ(rc, 0);
  close(pipeFds[1]);
  TerminateTestCallback callback(&eventBase, pipeFds[0]);

  // Test once where the callback will exit after a loop callback
  callback.reset(10, 100);
  eventBase.runInLoop(&callback);
  eventBase.loop();
  ASSERT_EQ(callback.getLoopInvocations(), 10);
  ASSERT_EQ(callback.getEventInvocations(), 9);

  // Test once where the callback will exit after an fd event callback
  callback.reset(100, 7);
  eventBase.runInLoop(&callback);
  eventBase.loop();
  ASSERT_EQ(callback.getLoopInvocations(), 7);
  ASSERT_EQ(callback.getEventInvocations(), 7);

  close(pipeFds[0]);
}

///////////////////////////////////////////////////////////////////////////
// Tests for latency calculations
///////////////////////////////////////////////////////////////////////////

class IdleTimeTimeoutSeries : public AsyncTimeout {
 public:
  explicit IdleTimeTimeoutSeries(
      EventBase* base,
      std::deque<std::size_t>& timeout)
      : AsyncTimeout(base), timeouts_(0), timeout_(timeout) {
    scheduleTimeout(1);
  }

  ~IdleTimeTimeoutSeries() override {}

  void timeoutExpired() noexcept override {
    ++timeouts_;

    if (timeout_.empty()) {
      cancelTimeout();
    } else {
      std::size_t sleepTime = timeout_.front();
      timeout_.pop_front();
      if (sleepTime) {
        usleep(sleepTime);
      }
      scheduleTimeout(1);
    }
  }

  int getTimeouts() const {
    return timeouts_;
  }

 private:
  int timeouts_;
  std::deque<std::size_t>& timeout_;
};

/**
 * Verify that idle time is correctly accounted for when decaying our loop
 * time.
 *
 * This works by creating a high loop time (via usleep), expecting a latency
 * callback with known value, and then scheduling a timeout for later. This
 * later timeout is far enough in the future that the idle time should have
 * caused the loop time to decay.
 */
TEST(EventBaseTest, IdleTime) {
  EventBase eventBase;
  std::deque<std::size_t> timeouts0(4, 8080);
  timeouts0.push_front(8000);
  timeouts0.push_back(14000);
  IdleTimeTimeoutSeries tos0(&eventBase, timeouts0);
  std::deque<std::size_t> timeouts(20, 20);
  std::unique_ptr<IdleTimeTimeoutSeries> tos;
  bool hostOverloaded = false;

  // Loop once before starting the main test.  This will run NotificationQueue
  // callbacks that get automatically installed when the EventBase is first
  // created.  We want to make sure they don't interfere with the timing
  // operations below.
  eventBase.loopOnce(EVLOOP_NONBLOCK);
  eventBase.setLoadAvgMsec(1000ms);
  eventBase.resetLoadAvg(5900.0);
  auto testStart = std::chrono::steady_clock::now();

  int latencyCallbacks = 0;
  eventBase.setMaxLatency(6000us, [&]() {
    ++latencyCallbacks;
    if (latencyCallbacks != 1) {
      FAIL() << "Unexpected latency callback";
    }

    if (tos0.getTimeouts() < 6) {
      // This could only happen if the host this test is running
      // on is heavily loaded.
      int64_t usElapsed = duration_cast<microseconds>(
                              std::chrono::steady_clock::now() - testStart)
                              .count();
      EXPECT_LE(43800, usElapsed);
      hostOverloaded = true;
      return;
    }
    EXPECT_EQ(6, tos0.getTimeouts());
    EXPECT_GE(6100, eventBase.getAvgLoopTime() - 1200);
    EXPECT_LE(6100, eventBase.getAvgLoopTime() + 1200);
    tos = std::make_unique<IdleTimeTimeoutSeries>(&eventBase, timeouts);
  });

  // Kick things off with an "immediate" timeout
  tos0.scheduleTimeout(1);

  eventBase.loop();

  if (hostOverloaded) {
    SKIP() << "host too heavily loaded to execute test";
  }

  ASSERT_EQ(1, latencyCallbacks);
  ASSERT_EQ(7, tos0.getTimeouts());
  ASSERT_GE(5900, eventBase.getAvgLoopTime() - 1200);
  ASSERT_LE(5900, eventBase.getAvgLoopTime() + 1200);
  ASSERT_TRUE(!!tos);
  ASSERT_EQ(21, tos->getTimeouts());
}

/**
 * Test that thisLoop functionality works with terminateLoopSoon
 */
TEST(EventBaseTest, ThisLoop) {
  EventBase eb;
  bool runInLoop = false;
  bool runThisLoop = false;

  eb.runInLoop(
      [&]() {
        eb.terminateLoopSoon();
        eb.runInLoop([&]() { runInLoop = true; });
        eb.runInLoop([&]() { runThisLoop = true; }, true);
      },
      true);
  eb.loopForever();

  // Should not work
  ASSERT_FALSE(runInLoop);
  // Should work with thisLoop
  ASSERT_TRUE(runThisLoop);
}

TEST(EventBaseTest, EventBaseThreadLoop) {
  EventBase base;
  bool ran = false;

  base.runInEventBaseThread([&]() { ran = true; });
  base.loop();

  ASSERT_TRUE(ran);
}

TEST(EventBaseTest, EventBaseThreadName) {
  EventBase base;
  base.setName("foo");
  base.loop();

#if (__GLIBC__ >= 2) && (__GLIBC_MINOR__ >= 12)
  char name[16];
  pthread_getname_np(pthread_self(), name, 16);
  ASSERT_EQ(0, strcmp("foo", name));
#endif
}

TEST(EventBaseTest, RunBeforeLoop) {
  EventBase base;
  CountedLoopCallback cb(&base, 1, [&]() { base.terminateLoopSoon(); });
  base.runBeforeLoop(&cb);
  base.loopForever();
  ASSERT_EQ(cb.getCount(), 0);
}

TEST(EventBaseTest, RunBeforeLoopWait) {
  EventBase base;
  CountedLoopCallback cb(&base, 1);
  base.tryRunAfterDelay([&]() { base.terminateLoopSoon(); }, 500);
  base.runBeforeLoop(&cb);
  base.loopForever();

  // Check that we only ran once, and did not loop multiple times.
  ASSERT_EQ(cb.getCount(), 0);
}

class PipeHandler : public EventHandler {
 public:
  PipeHandler(EventBase* eventBase, int fd) : EventHandler(eventBase, fd) {}

  void handlerReady(uint16_t /* events */) noexcept override {
    abort();
  }
};

TEST(EventBaseTest, StopBeforeLoop) {
  EventBase evb;

  // Give the evb something to do.
  int p[2];
  ASSERT_EQ(0, pipe(p));
  PipeHandler handler(&evb, p[0]);
  handler.registerHandler(EventHandler::READ);

  // It's definitely not running yet
  evb.terminateLoopSoon();

  // let it run, it should exit quickly.
  std::thread t([&] { evb.loop(); });
  t.join();

  handler.unregisterHandler();
  close(p[0]);
  close(p[1]);

  SUCCEED();
}

TEST(EventBaseTest, RunCallbacksOnDestruction) {
  bool ran = false;

  {
    EventBase base;
    base.runInEventBaseThread([&]() { ran = true; });
  }

  ASSERT_TRUE(ran);
}

TEST(EventBaseTest, LoopKeepAlive) {
  EventBase evb;

  bool done = false;
  std::thread t([&, loopKeepAlive = getKeepAliveToken(evb)]() mutable {
    /* sleep override */ std::this_thread::sleep_for(
        std::chrono::milliseconds(100));
    evb.runInEventBaseThread(
        [&done, loopKeepAlive = std::move(loopKeepAlive)] { done = true; });
  });

  evb.loop();

  ASSERT_TRUE(done);

  t.join();
}

TEST(EventBaseTest, LoopKeepAliveInLoop) {
  EventBase evb;

  bool done = false;
  std::thread t;

  evb.runInEventBaseThread([&] {
    t = std::thread([&, loopKeepAlive = getKeepAliveToken(evb)]() mutable {
      /* sleep override */ std::this_thread::sleep_for(
          std::chrono::milliseconds(100));
      evb.runInEventBaseThread(
          [&done, loopKeepAlive = std::move(loopKeepAlive)] { done = true; });
    });
  });

  evb.loop();

  ASSERT_TRUE(done);

  t.join();
}

TEST(EventBaseTest, LoopKeepAliveWithLoopForever) {
  std::unique_ptr<EventBase> evb = std::make_unique<EventBase>();

  bool done = false;

  std::thread evThread([&] {
    evb->loopForever();
    evb.reset();
    done = true;
  });

  {
    auto* ev = evb.get();
    Executor::KeepAlive<EventBase> keepAlive;
    ev->runInEventBaseThreadAndWait(
        [&ev, &keepAlive] { keepAlive = getKeepAliveToken(ev); });
    ASSERT_FALSE(done) << "Loop finished before we asked it to";
    ev->terminateLoopSoon();
    /* sleep override */
    std::this_thread::sleep_for(std::chrono::milliseconds(30));
    ASSERT_FALSE(done) << "Loop terminated early";
    ev->runInEventBaseThread([keepAlive = std::move(keepAlive)] {});
  }

  evThread.join();
  ASSERT_TRUE(done);
}

TEST(EventBaseTest, LoopKeepAliveShutdown) {
  auto evb = std::make_unique<EventBase>();

  bool done = false;

  std::thread t([&done,
                 loopKeepAlive = getKeepAliveToken(evb.get()),
                 evbPtr = evb.get()]() mutable {
    /* sleep override */ std::this_thread::sleep_for(
        std::chrono::milliseconds(100));
    evbPtr->runInEventBaseThread(
        [&done, loopKeepAlive = std::move(loopKeepAlive)] { done = true; });
  });

  evb.reset();

  ASSERT_TRUE(done);

  t.join();
}

TEST(EventBaseTest, LoopKeepAliveAtomic) {
  auto evb = std::make_unique<EventBase>();

  static constexpr size_t kNumThreads = 100;
  static constexpr size_t kNumTasks = 100;

  std::vector<std::thread> ts;
  std::vector<std::unique_ptr<Baton<>>> batons;
  size_t done{0};

  for (size_t i = 0; i < kNumThreads; ++i) {
    batons.emplace_back(std::make_unique<Baton<>>());
  }

  for (size_t i = 0; i < kNumThreads; ++i) {
    ts.emplace_back([evbPtr = evb.get(), batonPtr = batons[i].get(), &done] {
      std::vector<Executor::KeepAlive<EventBase>> keepAlives;
      for (size_t j = 0; j < kNumTasks; ++j) {
        keepAlives.emplace_back(getKeepAliveToken(evbPtr));
      }

      batonPtr->post();

      /* sleep override */ std::this_thread::sleep_for(std::chrono::seconds(1));

      for (auto& keepAlive : keepAlives) {
        evbPtr->runInEventBaseThread(
            [&done, keepAlive = std::move(keepAlive)]() { ++done; });
      }
    });
  }

  for (auto& baton : batons) {
    baton->wait();
  }

  evb.reset();

  EXPECT_EQ(kNumThreads * kNumTasks, done);

  for (auto& t : ts) {
    t.join();
  }
}

TEST(EventBaseTest, LoopKeepAliveCast) {
  EventBase evb;
  Executor::KeepAlive<> keepAlive = getKeepAliveToken(evb);
}

TEST(EventBaseTest, DrivableExecutorTest) {
  folly::Promise<bool> p;
  auto f = p.getFuture();
  EventBase base;
  bool finished = false;

  std::thread t([&] {
    /* sleep override */
    std::this_thread::sleep_for(std::chrono::microseconds(10));
    finished = true;
    base.runInEventBaseThread([&]() { p.setValue(true); });
  });

  // Ensure drive does not busy wait
  base.drive(); // TODO: fix notification queue init() extra wakeup
  base.drive();
  EXPECT_TRUE(finished);

  folly::Promise<bool> p2;
  auto f2 = p2.getFuture();
  // Ensure waitVia gets woken up properly, even from
  // a separate thread.
  base.runAfterDelay([&]() { p2.setValue(true); }, 10);
  f2.waitVia(&base);
  EXPECT_TRUE(f2.isReady());

  t.join();
}

TEST(EventBaseTest, IOExecutorTest) {
  EventBase base;

  // Ensure EventBase manages itself as an IOExecutor.
  EXPECT_EQ(base.getEventBase(), &base);
}

TEST(EventBaseTest, RequestContextTest) {
  EventBase evb;
  auto defaultCtx = RequestContext::get();
  std::weak_ptr<RequestContext> rctx_weak_ptr;

  {
    RequestContextScopeGuard rctx;
    rctx_weak_ptr = RequestContext::saveContext();
    auto context = RequestContext::get();
    EXPECT_NE(defaultCtx, context);
    evb.runInLoop([context] { EXPECT_EQ(context, RequestContext::get()); });
    evb.loop();
  }

  // Ensure that RequestContext created for the scope has been released and
  // deleted.
  EXPECT_EQ(rctx_weak_ptr.expired(), true);

  EXPECT_EQ(defaultCtx, RequestContext::get());
}

TEST(EventBaseTest, CancelLoopCallbackRequestContextTest) {
  EventBase evb;
  CountedLoopCallback c(&evb, 1);

  auto defaultCtx = RequestContext::get();
  EXPECT_EQ(defaultCtx, RequestContext::get());
  std::weak_ptr<RequestContext> rctx_weak_ptr;

  {
    RequestContextScopeGuard rctx;
    rctx_weak_ptr = RequestContext::saveContext();
    auto context = RequestContext::get();
    EXPECT_NE(defaultCtx, context);
    evb.runInLoop(&c);
    c.cancelLoopCallback();
  }

  // Ensure that RequestContext created for the scope has been released and
  // deleted.
  EXPECT_EQ(rctx_weak_ptr.expired(), true);

  EXPECT_EQ(defaultCtx, RequestContext::get());
}
