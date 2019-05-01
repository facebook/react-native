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

#include <bitset>
#include <future>
#include <thread>

#include <folly/MPMCQueue.h>
#include <folly/ScopeGuard.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventHandler.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Sockets.h>
#include <sys/eventfd.h>

using namespace std;
using namespace folly;
using namespace testing;

void runInThreadsAndWait(size_t nthreads, function<void(size_t)> cb) {
  vector<thread> threads(nthreads);
  for (size_t i = 0; i < nthreads; ++i) {
    threads[i] = thread(cb, i);
  }
  for (size_t i = 0; i < nthreads; ++i) {
    threads[i].join();
  }
}

void runInThreadsAndWait(vector<function<void()>> cbs) {
  runInThreadsAndWait(cbs.size(), [&](size_t k) { cbs[k](); });
}

class EventHandlerMock : public EventHandler {
 public:
  EventHandlerMock(EventBase* eb, int fd) : EventHandler(eb, fd) {}
  // gmock can't mock noexcept methods, so we need an intermediary
  MOCK_METHOD1(_handlerReady, void(uint16_t));
  void handlerReady(uint16_t events) noexcept override {
    _handlerReady(events);
  }
};

class EventHandlerTest : public Test {
 public:
  int efd = 0;

  void SetUp() override {
    efd = eventfd(0, EFD_SEMAPHORE);
    ASSERT_THAT(efd, Gt(0));
  }

  void TearDown() override {
    if (efd > 0) {
      close(efd);
    }
    efd = 0;
  }

  void efd_write(uint64_t val) {
    write(efd, &val, sizeof(val));
  }

  uint64_t efd_read() {
    uint64_t val = 0;
    read(efd, &val, sizeof(val));
    return val;
  }
};

TEST_F(EventHandlerTest, simple) {
  const size_t writes = 4;
  size_t readsRemaining = writes;

  EventBase eb;
  EventHandlerMock eh(&eb, efd);
  eh.registerHandler(EventHandler::READ | EventHandler::PERSIST);
  EXPECT_CALL(eh, _handlerReady(_))
      .Times(writes)
      .WillRepeatedly(Invoke([&](uint16_t /* events */) {
        efd_read();
        if (--readsRemaining == 0) {
          eh.unregisterHandler();
        }
      }));
  efd_write(writes);
  eb.loop();

  EXPECT_EQ(0, readsRemaining);
}

TEST_F(EventHandlerTest, many_concurrent_producers) {
  const size_t writes = 200;
  const size_t nproducers = 20;
  size_t readsRemaining = writes;

  runInThreadsAndWait({
      [&] {
        EventBase eb;
        EventHandlerMock eh(&eb, efd);
        eh.registerHandler(EventHandler::READ | EventHandler::PERSIST);
        EXPECT_CALL(eh, _handlerReady(_))
            .Times(writes)
            .WillRepeatedly(Invoke([&](uint16_t /* events */) {
              efd_read();
              if (--readsRemaining == 0) {
                eh.unregisterHandler();
              }
            }));
        eb.loop();
      },
      [&] {
        runInThreadsAndWait(nproducers, [&](size_t /* k */) {
          for (size_t i = 0; i < writes / nproducers; ++i) {
            this_thread::sleep_for(std::chrono::milliseconds(1));
            efd_write(1);
          }
        });
      },
  });

  EXPECT_EQ(0, readsRemaining);
}

TEST_F(EventHandlerTest, many_concurrent_consumers) {
  const size_t writes = 200;
  const size_t nproducers = 8;
  const size_t nconsumers = 20;
  atomic<size_t> writesRemaining(writes);
  atomic<size_t> readsRemaining(writes);

  MPMCQueue<nullptr_t> queue(writes / 10);

  runInThreadsAndWait({
      [&] {
        runInThreadsAndWait(nconsumers, [&](size_t /* k */) {
          size_t thReadsRemaining = writes / nconsumers;
          EventBase eb;
          EventHandlerMock eh(&eb, efd);
          eh.registerHandler(EventHandler::READ | EventHandler::PERSIST);
          EXPECT_CALL(eh, _handlerReady(_))
              .WillRepeatedly(Invoke([&](uint16_t /* events */) {
                nullptr_t val;
                if (!queue.readIfNotEmpty(val)) {
                  return;
                }
                efd_read();
                --readsRemaining;
                if (--thReadsRemaining == 0) {
                  eh.unregisterHandler();
                }
              }));
          eb.loop();
        });
      },
      [&] {
        runInThreadsAndWait(nproducers, [&](size_t /* k */) {
          for (size_t i = 0; i < writes / nproducers; ++i) {
            this_thread::sleep_for(std::chrono::milliseconds(1));
            queue.blockingWrite(nullptr);
            efd_write(1);
            --writesRemaining;
          }
        });
      },
  });

  EXPECT_EQ(0, writesRemaining);
  EXPECT_EQ(0, readsRemaining);
}

#ifdef EV_PRI
//
// See rfc6093 for extensive discussion on TCP URG semantics. Specificaly,
// it points out that URG mechanism was never intended to be used
// for out-of-band information delivery. However, pretty much every
// implementation interprets the LAST octect or urgent data as the
// OOB byte.
//
class EventHandlerOobTest : public ::testing::Test {
 public:
  //
  // Wait for port number to connect to, then connect and invoke
  // clientOps(fd) where fd is the connection file descriptor
  //
  void runClient(std::function<void(int fd)> clientOps) {
    clientThread = std::thread([serverPortFuture = serverReady.get_future(),
                                clientOps]() mutable {
      int clientFd = socket(AF_INET, SOCK_STREAM, 0);
      SCOPE_EXIT {
        close(clientFd);
      };
      struct hostent* he{nullptr};
      struct sockaddr_in server;

      std::array<const char, 10> hostname = {"localhost"};
      he = gethostbyname(hostname.data());
      PCHECK(he);

      memcpy(&server.sin_addr, he->h_addr_list[0], he->h_length);
      server.sin_family = AF_INET;

      // block here until port is known
      server.sin_port = serverPortFuture.get();
      LOG(INFO) << "Server is ready";

      PCHECK(
          ::connect(clientFd, (struct sockaddr*)&server, sizeof(server)) == 0);
      LOG(INFO) << "Server connection available";

      clientOps(clientFd);
    });
  }

  //
  // Bind, get port number, pass it to client, listen/accept and store the
  // accepted fd
  //
  void acceptConn() {
    // make the server.
    int listenfd = socket(AF_INET, SOCK_STREAM, 0);
    SCOPE_EXIT {
      close(listenfd);
    };
    PCHECK(listenfd != -1) << "unable to open socket";

    struct sockaddr_in sin;
    sin.sin_port = htons(0);
    sin.sin_addr.s_addr = INADDR_ANY;
    sin.sin_family = AF_INET;

    PCHECK(bind(listenfd, (struct sockaddr*)&sin, sizeof(sin)) >= 0)
        << "Can't bind to port";
    listen(listenfd, 5);

    struct sockaddr_in findSockName;
    socklen_t sz = sizeof(findSockName);
    getsockname(listenfd, (struct sockaddr*)&findSockName, &sz);
    serverReady.set_value(findSockName.sin_port);

    struct sockaddr_in cli_addr;
    socklen_t clilen = sizeof(cli_addr);
    serverFd = accept(listenfd, (struct sockaddr*)&cli_addr, &clilen);
    PCHECK(serverFd >= 0) << "can't accept";
  }

  void SetUp() override {}

  void TearDown() override {
    clientThread.join();
    close(serverFd);
  }

  EventBase eb;
  std::thread clientThread;
  std::promise<decltype(sockaddr_in::sin_port)> serverReady;
  int serverFd{-1};
};

//
// Test that sending OOB data is detected by event handler
//
TEST_F(EventHandlerOobTest, EPOLLPRI) {
  auto clientOps = [](int fd) {
    char buffer[] = "banana";
    int n = send(fd, buffer, strlen(buffer) + 1, MSG_OOB);
    LOG(INFO) << "Client send finished";
    PCHECK(n > 0);
  };

  runClient(clientOps);
  acceptConn();

  struct SockEvent : public EventHandler {
    SockEvent(EventBase* eb, int fd) : EventHandler(eb, fd), fd_(fd) {}

    void handlerReady(uint16_t events) noexcept override {
      EXPECT_TRUE(EventHandler::EventFlags::PRI & events);
      std::array<char, 255> buffer;
      int n = read(fd_, buffer.data(), buffer.size());
      //
      // NB: we sent 7 bytes, but only received 6. The last byte
      // has been stored in the OOB buffer.
      //
      EXPECT_EQ(6, n);
      EXPECT_EQ("banana", std::string(buffer.data(), 6));
      // now read the byte stored in OOB buffer
      n = recv(fd_, buffer.data(), buffer.size(), MSG_OOB);
      EXPECT_EQ(1, n);
    }

   private:
    int fd_;
  } sockHandler(&eb, serverFd);

  sockHandler.registerHandler(EventHandler::EventFlags::PRI);
  LOG(INFO) << "Registered Handler";
  eb.loop();
}

//
// Test if we can send an OOB byte and then normal data
//
TEST_F(EventHandlerOobTest, OOB_AND_NORMAL_DATA) {
  auto clientOps = [](int sockfd) {
    {
      // OOB buffer can only hold one byte in most implementations
      std::array<char, 2> buffer = {"X"};
      int n = send(sockfd, buffer.data(), 1, MSG_OOB);
      PCHECK(n > 0);
    }

    {
      std::array<char, 7> buffer = {"banana"};
      int n = send(sockfd, buffer.data(), buffer.size(), 0);
      PCHECK(n > 0);
    }
  };

  runClient(clientOps);
  acceptConn();

  struct SockEvent : public EventHandler {
    SockEvent(EventBase* eb, int fd) : EventHandler(eb, fd), eb_(eb), fd_(fd) {}

    void handlerReady(uint16_t events) noexcept override {
      std::array<char, 255> buffer;
      if (events & EventHandler::EventFlags::PRI) {
        int n = recv(fd_, buffer.data(), buffer.size(), MSG_OOB);
        EXPECT_EQ(1, n);
        EXPECT_EQ("X", std::string(buffer.data(), 1));
        registerHandler(EventHandler::EventFlags::READ);
        return;
      }

      if (events & EventHandler::EventFlags::READ) {
        int n = recv(fd_, buffer.data(), buffer.size(), 0);
        EXPECT_EQ(7, n);
        EXPECT_EQ("banana", std::string(buffer.data()));
        eb_->terminateLoopSoon();
        return;
      }
    }

   private:
    EventBase* eb_;
    int fd_;
  } sockHandler(&eb, serverFd);
  sockHandler.registerHandler(
      EventHandler::EventFlags::PRI | EventHandler::EventFlags::READ);
  LOG(INFO) << "Registered Handler";
  eb.loopForever();
}

//
// Demonstrate that "regular" reads ignore the OOB byte sent to us
//
TEST_F(EventHandlerOobTest, SWALLOW_OOB) {
  auto clientOps = [](int sockfd) {
    {
      std::array<char, 2> buffer = {"X"};
      int n = send(sockfd, buffer.data(), 1, MSG_OOB);
      PCHECK(n > 0);
    }

    {
      std::array<char, 7> buffer = {"banana"};
      int n = send(sockfd, buffer.data(), buffer.size(), 0);
      PCHECK(n > 0);
    }
  };

  runClient(clientOps);
  acceptConn();

  struct SockEvent : public EventHandler {
    SockEvent(EventBase* eb, int fd) : EventHandler(eb, fd), fd_(fd) {}

    void handlerReady(uint16_t events) noexcept override {
      std::array<char, 255> buffer;
      ASSERT_TRUE(events & EventHandler::EventFlags::READ);
      int n = recv(fd_, buffer.data(), buffer.size(), 0);
      EXPECT_EQ(7, n);
      EXPECT_EQ("banana", std::string(buffer.data()));
    }

   private:
    int fd_;
  } sockHandler(&eb, serverFd);
  sockHandler.registerHandler(EventHandler::EventFlags::READ);
  LOG(INFO) << "Registered Handler";
  eb.loop();
}
#endif
