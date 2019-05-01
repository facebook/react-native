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
#ifndef _WIN32
#include <unistd.h>
#endif

#include <folly/Conv.h>
#include <folly/Exception.h>
#include <folly/FileUtil.h>
#include <folly/experimental/TestUtil.h>
#include <folly/logging/ImmediateFileWriter.h>
#include <folly/logging/LoggerDB.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>

using namespace folly;
using folly::test::TemporaryFile;

TEST(ImmediateFileWriter, readBatch) {
  TemporaryFile tmpFile{"logging_test"};
  ImmediateFileWriter writer{folly::File{tmpFile.fd(), false}};

  // Write several messages
  for (int n = 0; n < 10; ++n) {
    writer.writeMessage(folly::to<std::string>("message ", n, "\n"));
  }

  // Read the log file and confirm it contains all of the expected messages
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

TEST(ImmediateFileWriter, immediateRead) {
  TemporaryFile tmpFile{"logging_test"};
  ImmediateFileWriter writer{tmpFile.path().string()};

  // Write several messages, and read each one back immediately
  // after we write it.
  folly::File readf{tmpFile.path().string()};
  for (int n = 0; n < 10; ++n) {
    writer.writeMessage(folly::to<std::string>("message ", n, "\n"));

    std::array<char, 1024> buf;
    auto sizeRead = folly::readFull(readf.fd(), buf.data(), buf.size());
    ASSERT_GT(sizeRead, 0);
    EXPECT_EQ(
        folly::to<std::string>("message ", n, "\n"),
        StringPiece(buf.data(), sizeRead));
  }
}

#ifndef _WIN32
namespace {
static std::vector<std::string>* internalWarnings;

void handleLoggingError(
    StringPiece /* file */,
    int /* lineNumber */,
    std::string&& msg) {
  internalWarnings->emplace_back(std::move(msg));
}
} // namespace

TEST(ImmediateFileWriter, ioError) {
  std::array<int, 2> fds;
  auto rc = pipe(fds.data());
  folly::checkUnixError(rc, "failed to create pipe");
  signal(SIGPIPE, SIG_IGN);

  // Set the LoggerDB internal warning handler so we can record the messages
  std::vector<std::string> logErrors;
  internalWarnings = &logErrors;
  LoggerDB::setInternalWarningHandler(handleLoggingError);

  // Create an ImmediateFileWriter that refers to a pipe whose read end is
  // closed, then log a bunch of messages to it.
  ::close(fds[0]);

  size_t numMessages = 100;
  {
    ImmediateFileWriter writer{folly::File{fds[1], true}};
    for (size_t n = 0; n < numMessages; ++n) {
      writer.writeMessage(folly::to<std::string>("message ", n, "\n"));
      sched_yield();
    }
  }

  LoggerDB::setInternalWarningHandler(nullptr);

  // ImmediateFileWriter should have generated one warning
  // for each attempt to log a message.
  //
  // (The default internalWarning() handler would have rate limited these
  // messages, but our test handler does not perform rate limiting.)
  for (const auto& msg : logErrors) {
    EXPECT_THAT(msg, testing::HasSubstr("error writing to log file"));
    EXPECT_THAT(msg, testing::HasSubstr("Broken pipe"));
  }
  EXPECT_EQ(numMessages, logErrors.size());
}
#endif
