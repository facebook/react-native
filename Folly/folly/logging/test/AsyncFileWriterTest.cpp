/*
 * Copyright 2017-present Facebook, Inc.
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
#include <thread>

#include <folly/Conv.h>
#include <folly/Exception.h>
#include <folly/File.h>
#include <folly/FileUtil.h>
#include <folly/String.h>
#include <folly/Synchronized.h>
#include <folly/experimental/TestUtil.h>
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>
#include <folly/init/Init.h>
#include <folly/lang/SafeAssert.h>
#include <folly/logging/AsyncFileWriter.h>
#include <folly/logging/Init.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/xlog.h>
#include <folly/portability/Config.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Unistd.h>
#include <folly/system/ThreadId.h>
#include <folly/system/ThreadName.h>
#include <folly/test/TestUtils.h>

DEFINE_int64(
    async_discard_num_normal_writers,
    30,
    "number of threads to use to generate normal log messages during "
    "the AsyncFileWriter.discard test");
DEFINE_int64(
    async_discard_num_nodiscard_writers,
    2,
    "number of threads to use to generate non-discardable log messages during "
    "the AsyncFileWriter.discard test");
DEFINE_int64(
    async_discard_read_sleep_usec,
    500,
    "how long the read thread should sleep between reads in "
    "the AsyncFileWriter.discard test");
DEFINE_int64(
    async_discard_timeout_msec,
    10000,
    "A timeout for the AsyncFileWriter.discard test if it cannot generate "
    "enough discards");
DEFINE_int64(
    async_discard_num_events,
    10,
    "The number of discard events to wait for in the AsyncFileWriter.discard "
    "test");

using namespace folly;
using namespace std::literals::chrono_literals;
using folly::test::TemporaryFile;
using std::chrono::milliseconds;
using std::chrono::steady_clock;
using testing::ContainsRegex;

TEST(AsyncFileWriter, noMessages) {
  TemporaryFile tmpFile{"logging_test"};

  // Test the simple construction and destruction of an AsyncFileWriter
  // without ever writing any messages.  This still exercises the I/O
  // thread start-up and shutdown code.
  AsyncFileWriter writer{folly::File{tmpFile.fd(), false}};
}

TEST(AsyncFileWriter, simpleMessages) {
  TemporaryFile tmpFile{"logging_test"};

  {
    AsyncFileWriter writer{folly::File{tmpFile.fd(), false}};
    for (int n = 0; n < 10; ++n) {
      writer.writeMessage(folly::to<std::string>("message ", n, "\n"));
      std::this_thread::yield();
    }
  }
  tmpFile.close();

  std::string data;
  auto ret = folly::readFile(tmpFile.path().string().c_str(), data);
  ASSERT_TRUE(ret);

  std::string expected =
      "message 0\n"
      "message 1\n"
      "message 2\n"
      "message 3\n"
      "message 4\n"
      "message 5\n"
      "message 6\n"
      "message 7\n"
      "message 8\n"
      "message 9\n";
  EXPECT_EQ(expected, data);
}

namespace {
static std::vector<std::string>* internalWarnings;

void handleLoggingError(
    StringPiece /* file */,
    int /* lineNumber */,
    std::string&& msg) {
  internalWarnings->emplace_back(std::move(msg));
}
} // namespace

TEST(AsyncFileWriter, ioError) {
  // Set the LoggerDB internal warning handler so we can record the messages
  std::vector<std::string> logErrors;
  internalWarnings = &logErrors;
  LoggerDB::setInternalWarningHandler(handleLoggingError);

  // Create an AsyncFileWriter that refers to a pipe whose read end is closed
  std::array<int, 2> fds;
  auto rc = pipe(fds.data());
  folly::checkUnixError(rc, "failed to create pipe");
#ifndef _WIN32
  signal(SIGPIPE, SIG_IGN);
#endif
  ::close(fds[0]);

  // Log a bunch of messages to the writer
  size_t numMessages = 100;
  {
    AsyncFileWriter writer{folly::File{fds[1], true}};
    for (size_t n = 0; n < numMessages; ++n) {
      writer.writeMessage(folly::to<std::string>("message ", n, "\n"));
      std::this_thread::yield();
    }
  }

  LoggerDB::setInternalWarningHandler(nullptr);

  // AsyncFileWriter should have some internal warning messages about the
  // log failures.  This will generally be many fewer than the number of
  // messages we wrote, though, since it performs write batching.
  //
  // GTest on Windows doesn't support alternation in the regex syntax -_-....
  const std::string kExpectedErrorMessage =
#if _WIN32
      // The `pipe` call above is actually implemented via sockets, so we get
      // a different error message.
      "An established connection was aborted by the software in your host machine\\.";
#else
      "Broken pipe";
#endif

  for (const auto& msg : logErrors) {
    EXPECT_THAT(
        msg,
        ContainsRegex(
            "error writing to log file .* in AsyncFileWriter.*: " +
            kExpectedErrorMessage));
  }
  EXPECT_GT(logErrors.size(), 0);
  EXPECT_LE(logErrors.size(), numMessages);
}

namespace {
size_t fillUpPipe(int fd) {
  int flags = fcntl(fd, F_GETFL);
  folly::checkUnixError(flags, "failed get file descriptor flags");
  auto rc = fcntl(fd, F_SETFL, flags | O_NONBLOCK);
  folly::checkUnixError(rc, "failed to put pipe in non-blocking mode");
  std::vector<char> data;
  data.resize(4000);
  size_t totalBytes = 0;
  size_t bytesToWrite = data.size();
  while (true) {
    auto bytesWritten = writeNoInt(fd, data.data(), bytesToWrite);
    if (bytesWritten < 0) {
      if (errno == EAGAIN || errno == EWOULDBLOCK) {
        // We blocked.  Keep trying smaller writes, until we get down to a
        // single byte, just to make sure the logging code really won't be able
        // to write anything to the pipe.
        if (bytesToWrite <= 1) {
          break;
        } else {
          bytesToWrite /= 2;
        }
      } else {
        throwSystemError("error writing to pipe");
      }
    } else {
      totalBytes += bytesWritten;
    }
  }
  XLOG(DBG1, "pipe filled up after ", totalBytes, " bytes");

  rc = fcntl(fd, F_SETFL, flags & ~O_NONBLOCK);
  folly::checkUnixError(rc, "failed to put pipe back in blocking mode");

  return totalBytes;
}
} // namespace

TEST(AsyncFileWriter, flush) {
  // Set up a pipe(), then write data to the write endpoint until it fills up
  // and starts blocking.
  std::array<int, 2> fds;
  auto rc = pipe(fds.data());
  folly::checkUnixError(rc, "failed to create pipe");
  File readPipe{fds[0], true};
  File writePipe{fds[1], true};

  auto paddingSize = fillUpPipe(writePipe.fd());

  // Now set up an AsyncFileWriter pointing at the write end of the pipe
  AsyncFileWriter writer{std::move(writePipe)};

  // Write a message
  writer.writeMessage("test message: " + std::string(200, 'x'));

  // Call flush().  Use a separate thread, since this should block until we
  // consume data from the pipe.
  Promise<Unit> promise;
  auto future = promise.getFuture();
  auto flushFunction = [&] { writer.flush(); };
  std::thread flushThread{
      [&]() { promise.setTry(makeTryWith(flushFunction)); }};
  // Detach the flush thread now rather than joining it at the end of the
  // function.  This way if something goes wrong during the test we will fail
  // with the real error, rather than crashing due to the std::thread
  // destructor running on a still-joinable thread.
  flushThread.detach();

  // Sleep briefly, and make sure flush() still hasn't completed.
  // If it has completed this doesn't necessarily indicate a bug in
  // AsyncFileWriter, but instead indicates that our test code failed to
  // successfully cause a blocking write.
  /* sleep override */
  std::this_thread::sleep_for(10ms);
  EXPECT_FALSE(future.isReady());

  // Now read from the pipe
  std::vector<char> buf;
  buf.resize(paddingSize);
  auto bytesRead = readFull(readPipe.fd(), buf.data(), buf.size());
  EXPECT_EQ(bytesRead, paddingSize);

  // Make sure flush completes successfully now
  std::move(future).get(10ms);
}

// A large-ish message suffix, just to consume space and help fill up
// log buffers faster.
static constexpr StringPiece kMsgSuffix{
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"};

class ReadStats {
 public:
  ReadStats()
      : deadline_{steady_clock::now() +
                  milliseconds{FLAGS_async_discard_timeout_msec}},
        readSleepUS_{static_cast<uint64_t>(
            std::min(int64_t{0}, FLAGS_async_discard_read_sleep_usec))} {}

  void clearSleepDuration() {
    readSleepUS_.store(0);
  }
  std::chrono::microseconds getSleepUS() const {
    return std::chrono::microseconds{readSleepUS_.load()};
  }

  bool shouldWriterStop() const {
    // Stop after we have seen the required number of separate discard events.
    // We stop based on discardEventsSeen_ rather than numDiscarded_ since this
    // ensures the async writer blocks and then makes progress again multiple
    // times.
    if (FLAGS_async_discard_num_events > 0 &&
        discardEventsSeen_.load() >
            static_cast<uint64_t>(FLAGS_async_discard_num_events)) {
      return true;
    }

    // Stop after a timeout, even if we don't hit the number of requested
    // discards.
    return steady_clock::now() > deadline_;
  }
  void writerFinished(size_t threadID, size_t messagesWritten, uint32_t flags) {
    auto map = perThreadWriteData_.wlock();
    FOLLY_SAFE_CHECK(
        map->find(threadID) == map->end(),
        "multiple writer threads with same ID");
    auto& data = (*map)[threadID];
    data.numMessagesWritten = messagesWritten;
    data.flags = flags;
  }

  void check() {
    auto writeDataMap = perThreadWriteData_.wlock();

    EXPECT_EQ("", trailingData_);
    EXPECT_EQ(0, numUnableToParse_);
    EXPECT_EQ(0, numOutOfOrder_);

    // Check messages received from each writer thread
    size_t readerStatsChecked = 0;
    size_t totalMessagesWritten = 0;
    size_t totalMessagesRead = 0;
    for (const auto& writeEntry : *writeDataMap) {
      const auto& writeInfo = writeEntry.second;
      totalMessagesWritten += writeInfo.numMessagesWritten;

      auto iter = perThreadReadData_.find(writeEntry.first);
      if (iter == perThreadReadData_.end()) {
        // We never received any messages from this writer thread.
        // This is okay as long as this is not a NEVER_DISCARD writer.
        EXPECT_EQ(0, writeInfo.flags);
        continue;
      }
      const auto& readInfo = iter->second;
      ++readerStatsChecked;
      totalMessagesRead += readInfo.numMessagesRead;
      if (writeInfo.flags & LogWriter::NEVER_DISCARD) {
        // Non-discarding threads should never discard anything
        EXPECT_EQ(readInfo.numMessagesRead, writeInfo.numMessagesWritten);
        EXPECT_EQ(readInfo.lastId, writeInfo.numMessagesWritten);
      } else {
        // Other threads may have discarded some messages
        EXPECT_LE(readInfo.numMessagesRead, writeInfo.numMessagesWritten);
        EXPECT_LE(readInfo.lastId, writeInfo.numMessagesWritten);
      }
    }

    EXPECT_EQ(totalMessagesWritten, totalMessagesRead + numDiscarded_);
    EXPECT_EQ(readerStatsChecked, perThreadReadData_.size());

    // This test is intended to check the discard behavior.
    // Fail the test if we didn't actually trigger any discards before we timed
    // out.
    EXPECT_GT(numDiscarded_, 0);

    XLOG(DBG1) << totalMessagesWritten << " messages written, "
               << totalMessagesRead << " messages read, " << numDiscarded_
               << " messages discarded";
  }

  void messageReceived(StringPiece msg) {
    if (msg.endsWith(" log messages discarded: "
                     "logging faster than we can write")) {
      auto discardCount = folly::to<size_t>(msg.subpiece(0, msg.find(' ')));
      XLOG(DBG3, "received discard notification: ", discardCount);
      numDiscarded_ += discardCount;
      ++discardEventsSeen_;
      return;
    }

    size_t threadID = 0;
    size_t messageIndex = 0;
    try {
      parseMessage(msg, &threadID, &messageIndex);
    } catch (const std::exception& ex) {
      ++numUnableToParse_;
      XLOG(ERR, "unable to parse log message: ", msg);
      return;
    }

    auto& data = perThreadReadData_[threadID];
    data.numMessagesRead++;
    if (messageIndex > data.lastId) {
      data.lastId = messageIndex;
    } else {
      ++numOutOfOrder_;
      XLOG(ERR) << "received out-of-order messages from writer " << threadID
                << ": " << messageIndex << " received after " << data.lastId;
    }
  }

  void trailingData(StringPiece data) {
    trailingData_ = data.str();
  }

 private:
  struct ReaderData {
    size_t numMessagesRead{0};
    size_t lastId{0};
  };
  struct WriterData {
    size_t numMessagesWritten{0};
    int flags{0};
  };

  void parseMessage(StringPiece msg, size_t* threadID, size_t* messageIndex) {
    // Validate and strip off the message prefix and suffix
    constexpr StringPiece prefix{"thread "};
    if (!msg.startsWith(prefix)) {
      throw std::runtime_error("bad message prefix");
    }
    msg.advance(prefix.size());
    if (!msg.endsWith(kMsgSuffix)) {
      throw std::runtime_error("bad message suffix");
    }
    msg.subtract(kMsgSuffix.size());

    // Parse then strip off the thread index
    auto threadIDEnd = msg.find(' ');
    if (threadIDEnd == StringPiece::npos) {
      throw std::runtime_error("no middle found");
    }
    *threadID = folly::to<size_t>(msg.subpiece(0, threadIDEnd));
    msg.advance(threadIDEnd);

    // Validate that the middle of the message is what we expect,
    // then strip it off
    constexpr StringPiece middle{" message "};
    if (!msg.startsWith(middle)) {
      throw std::runtime_error("bad message middle");
    }
    msg.advance(middle.size());

    // Parse the message index
    *messageIndex = folly::to<size_t>(msg);
  }

  /**
   * Data about each writer thread, as recorded by the reader thread.
   *
   * At the end of the test we will compare perThreadReadData_ (recorded by the
   * reader) with perThreadWriteData_ (recorded by the writers) to make sure
   * the data matches up.
   *
   * This is a map from writer_thread_id to ReaderData.
   * The writer_thread_id is extracted from the received messages.
   *
   * This field does not need locking as it is only updated by the single
   * reader thread.
   */
  std::unordered_map<size_t, ReaderData> perThreadReadData_;

  /*
   * Additional information recorded by the reader thread.
   */
  std::string trailingData_;
  size_t numUnableToParse_{0};
  size_t numOutOfOrder_{0};
  size_t numDiscarded_{0};

  /**
   * deadline_ is a maximum end time for the test.
   *
   * The writer threads quit if the deadline is reached even if they have not
   * produced the desired number of discard events yet.
   */
  const std::chrono::steady_clock::time_point deadline_;

  /**
   * How long the reader thread should sleep between each read event.
   *
   * This is initially set to a non-zero value (read from the
   * FLAGS_async_discard_read_sleep_usec flag) so that the reader thread reads
   * slowly, which will fill up the pipe buffer and cause discard events.
   *
   * Once we have produce enough discards and are ready to finish the test the
   * main thread reduces readSleepUS_ to 0, so the reader will finish the
   * remaining message backlog quickly.
   */
  std::atomic<uint64_t> readSleepUS_{0};

  /**
   * A count of how many discard events have been seen so far.
   *
   * The reader increments discardEventsSeen_ each time it sees a discard
   * notification message.  A "discard event" basically corresponds to a single
   * group of dropped messages.  Once the reader pulls some messages off out of
   * the pipe the writers should be able to send more data, but the buffer will
   * eventually fill up again, producing another discard event.
   */
  std::atomic<uint64_t> discardEventsSeen_{0};

  /**
   * Data about each writer thread, as recorded by the writers.
   *
   * When each writer thread finishes it records how many messages it wrote,
   * plus the flags it used to write the messages.
   */
  folly::Synchronized<std::unordered_map<size_t, WriterData>>
      perThreadWriteData_;
};

/**
 * readThread() reads messages slowly from a pipe.  This helps test the
 * AsyncFileWriter behavior when I/O is slow.
 */
void readThread(folly::File&& file, ReadStats* stats) {
  std::vector<char> buffer;
  buffer.resize(1024);

  size_t bufferIdx = 0;
  while (true) {
    /* sleep override */
    std::this_thread::sleep_for(stats->getSleepUS());

    auto readResult = folly::readNoInt(
        file.fd(), buffer.data() + bufferIdx, buffer.size() - bufferIdx);
    if (readResult < 0) {
      XLOG(ERR, "error reading from pipe: ", errno);
      return;
    }
    if (readResult == 0) {
      XLOG(DBG2, "read EOF");
      break;
    }

    auto logDataLen = bufferIdx + readResult;
    StringPiece logData{buffer.data(), logDataLen};
    auto idx = 0;
    while (true) {
      auto end = logData.find('\n', idx);
      if (end == StringPiece::npos) {
        bufferIdx = logDataLen - idx;
        memmove(buffer.data(), buffer.data() + idx, bufferIdx);
        break;
      }

      StringPiece logMsg{logData.data() + idx, end - idx};
      stats->messageReceived(logMsg);
      idx = end + 1;
    }
  }

  if (bufferIdx != 0) {
    stats->trailingData(StringPiece{buffer.data(), bufferIdx});
  }
}

/**
 * writeThread() writes a series of messages to the AsyncFileWriter
 */
void writeThread(
    AsyncFileWriter* writer,
    size_t id,
    uint32_t flags,
    ReadStats* readStats) {
  size_t msgID = 0;
  while (true) {
    ++msgID;
    writer->writeMessage(
        folly::to<std::string>(
            "thread ", id, " message ", msgID, kMsgSuffix, '\n'),
        flags);

    // Break out once the reader has seen enough discards
    if (((msgID & 0xff) == 0) && readStats->shouldWriterStop()) {
      readStats->writerFinished(id, msgID, flags);
      break;
    }
  }
}

/*
 * The discard test spawns a number of threads that each write a large number
 * of messages quickly.  The AsyncFileWriter writes to a pipe, an a separate
 * thread reads from it slowly, causing a backlog to build up.
 *
 * The test then checks that:
 * - The read thread always receives full messages (no partial log messages)
 * - Messages that are received are received in order
 * - The number of messages received plus the number reported in discard
 *   notifications matches the number of messages sent.
 */
TEST(AsyncFileWriter, discard) {
  std::array<int, 2> fds;
  auto pipeResult = pipe(fds.data());
  folly::checkUnixError(pipeResult, "pipe failed");
  folly::File readPipe{fds[0], true};
  folly::File writePipe{fds[1], true};

  ReadStats readStats;
  std::thread reader(readThread, std::move(readPipe), &readStats);
  {
    AsyncFileWriter writer{std::move(writePipe)};

    std::vector<std::thread> writeThreads;
    size_t numThreads = FLAGS_async_discard_num_normal_writers +
        FLAGS_async_discard_num_nodiscard_writers;

    for (size_t n = 0; n < numThreads; ++n) {
      uint32_t flags = 0;
      if (n >= static_cast<size_t>(FLAGS_async_discard_num_normal_writers)) {
        flags = LogWriter::NEVER_DISCARD;
      }
      XLOGF(DBG4, "writer {:4d} flags {:#02x}", n, flags);

      writeThreads.emplace_back(writeThread, &writer, n, flags, &readStats);
    }

    for (auto& t : writeThreads) {
      t.join();
    }
    XLOG(DBG2, "writers done");
  }
  // Clear the read sleep duration so the reader will finish quickly now
  readStats.clearSleepDuration();
  reader.join();
  readStats.check();
}

/**
 * Test that AsyncFileWriter operates correctly after a fork() in both the
 * parent and child processes.
 */
TEST(AsyncFileWriter, fork) {
#if FOLLY_HAVE_PTHREAD_ATFORK
  TemporaryFile tmpFile{"logging_test"};

  // The number of messages to send before the fork and from each process
  constexpr size_t numMessages = 10;
  constexpr size_t numBgThreads = 2;

  // This can be increased to add some delay in the parent and child messages
  // so that they are likely to be interleaved in the log rather than grouped
  // together.  This doesn't really affect the test behavior or correctness
  // otherwise, though.
  constexpr milliseconds sleepDuration(0);

  {
    AsyncFileWriter writer{folly::File{tmpFile.fd(), false}};
    writer.writeMessage(folly::to<std::string>("parent pid=", getpid(), "\n"));

    // Start some background threads just to exercise the behavior
    // when other threads are also logging to the writer when the fork occurs
    std::vector<std::thread> bgThreads;
    std::atomic<bool> stop{false};
    for (size_t n = 0; n < numBgThreads; ++n) {
      bgThreads.emplace_back([&] {
        size_t iter = 0;
        while (!stop) {
          writer.writeMessage(
              folly::to<std::string>("bgthread_", getpid(), "_", iter, "\n"));
          ++iter;
        }
      });
    }

    for (size_t n = 0; n < numMessages; ++n) {
      writer.writeMessage(folly::to<std::string>("prefork", n, "\n"));
    }

    auto pid = fork();
    folly::checkUnixError(pid, "failed to fork");
    if (pid == 0) {
      writer.writeMessage(folly::to<std::string>("child pid=", getpid(), "\n"));
      for (size_t n = 0; n < numMessages; ++n) {
        writer.writeMessage(folly::to<std::string>("child", n, "\n"));
        std::this_thread::sleep_for(sleepDuration);
      }

      // Use _exit() rather than exit() in the child, purely to prevent
      // ASAN from complaining that we leak memory for the background threads.
      // (These threads don't actually exist in the child, so it is difficult
      // to clean up their allocated state entirely.)
      //
      // Explicitly flush the writer since exiting with _exit() won't do this
      // automatically.
      writer.flush();
      _exit(0);
    }

    for (size_t n = 0; n < numMessages; ++n) {
      writer.writeMessage(folly::to<std::string>("parent", n, "\n"));
      std::this_thread::sleep_for(sleepDuration);
    }

    // Stop the background threads.
    stop = true;
    for (auto& t : bgThreads) {
      t.join();
    }

    int status;
    auto waited = waitpid(pid, &status, 0);
    folly::checkUnixError(waited, "failed to wait on child");
    ASSERT_EQ(waited, pid);
  }

  // Read back the logged messages
  tmpFile.close();
  std::string data;
  auto ret = folly::readFile(tmpFile.path().string().c_str(), data);
  ASSERT_TRUE(ret) << "failed to read log file";

  XLOG(DBG1) << "log contents:\n" << data;

  // The log file should contain all of the messages we wrote, from both the
  // parent and child processes.
  for (size_t n = 0; n < numMessages; ++n) {
    EXPECT_THAT(
        data, ContainsRegex(folly::to<std::string>("prefork", n, "\n")));
    EXPECT_THAT(data, ContainsRegex(folly::to<std::string>("parent", n, "\n")));
    EXPECT_THAT(data, ContainsRegex(folly::to<std::string>("child", n, "\n")));
  }
#else
  SKIP() << "pthread_atfork() is not supported on this platform";
#endif // FOLLY_HAVE_PTHREAD_ATFORK
}

/**
 * Have several threads concurrently performing fork() calls while several
 * other threads continuously create and destroy AsyncFileWriter objects.
 *
 * This exercises the synchronization around registration of the AtFork
 * handlers and the creation/destruction of the AsyncFileWriter I/O thread.
 */
TEST(AsyncFileWriter, crazyForks) {
#if FOLLY_HAVE_PTHREAD_ATFORK
  constexpr size_t numAsyncWriterThreads = 10;
  constexpr size_t numForkThreads = 5;
  constexpr size_t numForkIterations = 20;
  std::atomic<bool> stop{false};

  // Spawn several threads that continuously create and destroy
  // AsyncFileWriter objects.
  std::vector<std::thread> asyncWriterThreads;
  for (size_t n = 0; n < numAsyncWriterThreads; ++n) {
    asyncWriterThreads.emplace_back([n, &stop] {
      folly::setThreadName(folly::to<std::string>("async_", n));

      TemporaryFile tmpFile{"logging_test"};
      while (!stop) {
        // Create an AsyncFileWriter, write a message to it, then destroy it.
        AsyncFileWriter writer{folly::File{tmpFile.fd(), false}};
        writer.writeMessage(folly::to<std::string>(
            "async thread ", folly::getOSThreadID(), "\n"));
      }
    });
  }

  // Spawn several threads that repeatedly fork.
  std::vector<std::thread> forkThreads;
  std::mutex forkStartMutex;
  std::condition_variable forkStartCV;
  bool forkStart = false;
  for (size_t n = 0; n < numForkThreads; ++n) {
    forkThreads.emplace_back([n, &forkStartMutex, &forkStartCV, &forkStart] {
      folly::setThreadName(folly::to<std::string>("fork_", n));

      // Wait until forkStart is set just to have a better chance of all the
      // fork threads running simultaneously.
      {
        std::unique_lock<std::mutex> l(forkStartMutex);
        forkStartCV.wait(l, [&forkStart] { return forkStart; });
      }

      for (size_t i = 0; i < numForkIterations; ++i) {
        XLOG(DBG3) << "fork " << n << ":" << i;
        auto pid = fork();
        folly::checkUnixError(pid, "forkFailed");
        if (pid == 0) {
          XLOG(DBG3) << "child " << getpid();
          _exit(0);
        }

        // parent
        int status;
        auto waited = waitpid(pid, &status, 0);
        folly::checkUnixError(waited, "failed to wait on child");
        EXPECT_EQ(waited, pid);
      }
    });
  }

  // Kick off the fork threads
  {
    std::unique_lock<std::mutex> l(forkStartMutex);
    forkStart = true;
  }
  forkStartCV.notify_all();

  // Wait for the fork threads to finish
  for (auto& t : forkThreads) {
    t.join();
  }

  // Stop and wait for the AsyncFileWriter threads
  stop = true;
  for (auto& t : asyncWriterThreads) {
    t.join();
  }
#else
  SKIP() << "pthread_atfork() is not supported on this platform";
#endif // FOLLY_HAVE_PTHREAD_ATFORK
}
