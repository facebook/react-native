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
#include <folly/logging/FileHandlerFactory.h>
#include <folly/logging/StreamHandlerFactory.h>

#include <folly/Exception.h>
#include <folly/experimental/TestUtil.h>
#include <folly/logging/AsyncFileWriter.h>
#include <folly/logging/GlogStyleFormatter.h>
#include <folly/logging/ImmediateFileWriter.h>
#include <folly/logging/StandardLogHandler.h>
#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

using namespace folly;
using folly::test::TemporaryFile;
using std::make_pair;

void checkAsyncWriter(
    const LogWriter* writer,
    const char* expectedPath,
    size_t expectedMaxBufferSize) {
  auto asyncWriter = dynamic_cast<const AsyncFileWriter*>(writer);
  ASSERT_TRUE(asyncWriter)
      << "handler factory should have created an AsyncFileWriter";
  EXPECT_EQ(expectedMaxBufferSize, asyncWriter->getMaxBufferSize());

  // Make sure this refers to the expected output file
  struct stat expectedStatInfo;
  checkUnixError(stat(expectedPath, &expectedStatInfo), "stat failed");
  struct stat actualStatInfo;
  checkUnixError(
      fstat(asyncWriter->getFile().fd(), &actualStatInfo), "fstat failed");
  EXPECT_EQ(expectedStatInfo.st_dev, actualStatInfo.st_dev);
  EXPECT_EQ(expectedStatInfo.st_ino, actualStatInfo.st_ino);
}

void checkAsyncWriter(
    const LogWriter* writer,
    int expectedFD,
    size_t expectedMaxBufferSize) {
  auto asyncWriter = dynamic_cast<const AsyncFileWriter*>(writer);
  ASSERT_TRUE(asyncWriter)
      << "handler factory should have created an AsyncFileWriter";
  EXPECT_EQ(expectedMaxBufferSize, asyncWriter->getMaxBufferSize());
  EXPECT_EQ(expectedFD, asyncWriter->getFile().fd());
}

TEST(FileHandlerFactory, pathOnly) {
  FileHandlerFactory factory;

  TemporaryFile tmpFile{"logging_test"};
  auto options = LogHandlerFactory::Options{
      make_pair("path", tmpFile.path().string()),
  };
  auto handler = factory.createHandler(options);

  auto stdHandler = std::dynamic_pointer_cast<StandardLogHandler>(handler);
  ASSERT_TRUE(stdHandler);

  auto formatter =
      std::dynamic_pointer_cast<GlogStyleFormatter>(stdHandler->getFormatter());
  EXPECT_TRUE(formatter)
      << "handler factory should have created a GlogStyleFormatter";

  checkAsyncWriter(
      stdHandler->getWriter().get(),
      tmpFile.path().string().c_str(),
      AsyncFileWriter::kDefaultMaxBufferSize);
}

TEST(StreamHandlerFactory, stderrStream) {
  StreamHandlerFactory factory;

  TemporaryFile tmpFile{"logging_test"};
  auto options = StreamHandlerFactory::Options{
      make_pair("stream", "stderr"),
  };
  auto handler = factory.createHandler(options);

  auto stdHandler = std::dynamic_pointer_cast<StandardLogHandler>(handler);
  ASSERT_TRUE(stdHandler);

  auto formatter =
      std::dynamic_pointer_cast<GlogStyleFormatter>(stdHandler->getFormatter());
  EXPECT_TRUE(formatter)
      << "handler factory should have created a GlogStyleFormatter";

  checkAsyncWriter(
      stdHandler->getWriter().get(),
      STDERR_FILENO,
      AsyncFileWriter::kDefaultMaxBufferSize);
}

TEST(StreamHandlerFactory, stdoutWithMaxBuffer) {
  StreamHandlerFactory factory;

  TemporaryFile tmpFile{"logging_test"};
  auto options = StreamHandlerFactory::Options{
      make_pair("stream", "stdout"),
      make_pair("max_buffer_size", "4096"),
  };
  auto handler = factory.createHandler(options);

  auto stdHandler = std::dynamic_pointer_cast<StandardLogHandler>(handler);
  ASSERT_TRUE(stdHandler);

  auto formatter =
      std::dynamic_pointer_cast<GlogStyleFormatter>(stdHandler->getFormatter());
  EXPECT_TRUE(formatter)
      << "handler factory should have created a GlogStyleFormatter";

  checkAsyncWriter(stdHandler->getWriter().get(), STDOUT_FILENO, 4096);
}

TEST(FileHandlerFactory, pathWithMaxBufferSize) {
  FileHandlerFactory factory;

  TemporaryFile tmpFile{"logging_test"};
  auto options = LogHandlerFactory::Options{
      make_pair("path", tmpFile.path().string()),
      make_pair("max_buffer_size", "4096000"),
  };
  auto handler = factory.createHandler(options);

  auto stdHandler = std::dynamic_pointer_cast<StandardLogHandler>(handler);
  ASSERT_TRUE(stdHandler);

  auto formatter =
      std::dynamic_pointer_cast<GlogStyleFormatter>(stdHandler->getFormatter());
  EXPECT_TRUE(formatter)
      << "handler factory should have created a GlogStyleFormatter";

  checkAsyncWriter(
      stdHandler->getWriter().get(), tmpFile.path().string().c_str(), 4096000);
}

TEST(StreamHandlerFactory, nonAsyncStderr) {
  StreamHandlerFactory factory;

  TemporaryFile tmpFile{"logging_test"};
  auto options = LogHandlerFactory::Options{
      make_pair("stream", "stderr"),
      make_pair("async", "no"),
  };
  auto handler = factory.createHandler(options);

  auto stdHandler = std::dynamic_pointer_cast<StandardLogHandler>(handler);
  ASSERT_TRUE(stdHandler);

  auto formatter =
      std::dynamic_pointer_cast<GlogStyleFormatter>(stdHandler->getFormatter());
  EXPECT_TRUE(formatter)
      << "handler factory should have created a GlogStyleFormatter";

  auto writer =
      std::dynamic_pointer_cast<ImmediateFileWriter>(stdHandler->getWriter());
  ASSERT_TRUE(writer);
  EXPECT_EQ(STDERR_FILENO, writer->getFile().fd());
}

TEST(FileHandlerFactory, errors) {
  FileHandlerFactory factory;
  TemporaryFile tmpFile{"logging_test"};
  using Options = LogHandlerFactory::Options;

  {
    auto options = Options{};
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "no path specified for file handler");
  }

  {
    auto options = Options{
        {"path", tmpFile.path().string()},
        {"stream", "stderr"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "unknown option \"stream\"");
  }

  {
    auto options = Options{
        {"stream", "nonstdout"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "unknown option \"stream\"");
  }

  {
    auto options = Options{
        {"path", tmpFile.path().string()},
        {"async", "xyz"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^error processing option \"async\": Invalid value for bool: \"xyz\"$");
  }

  {
    auto options = Options{
        {"path", tmpFile.path().string()},
        {"async", "false"},
        {"max_buffer_size", "1234"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "the \"max_buffer_size\" option is only valid for async file handlers");
  }

  {
    auto options = Options{
        {"path", tmpFile.path().string()},
        {"max_buffer_size", "hello"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^error processing option \"max_buffer_size\": "
        "Non-digit character found: \"hello\"$");
  }

  {
    auto options = Options{
        {"path", tmpFile.path().string()},
        {"max_buffer_size", "0"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^error processing option \"max_buffer_size\": "
        "must be a positive integer$");
  }

  {
    auto options = Options{
        {"path", tmpFile.path().string()},
        {"foo", "bar"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^unknown option \"foo\"$");
  }
}

TEST(StreamHandlerFactory, errors) {
  StreamHandlerFactory factory;
  using Options = LogHandlerFactory::Options;

  {
    auto options = Options{};
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "no stream name specified for stream handler");
  }

  {
    auto options = Options{
        {"path", "/tmp/log.txt"},
        {"stream", "stderr"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "unknown option \"path\"");
  }

  {
    auto options = Options{
        {"stream", "nonstdout"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "unknown stream \"nonstdout\": expected one of stdout or stderr");
  }

  {
    auto options = Options{
        {"stream", "stderr"},
        {"async", "xyz"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^error processing option \"async\": Invalid value for bool: \"xyz\"$");
  }

  {
    auto options = Options{
        {"stream", "stderr"},
        {"async", "false"},
        {"max_buffer_size", "1234"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^the \"max_buffer_size\" option is only valid for "
        "async file handlers$");
  }

  {
    auto options = Options{
        {"stream", "stderr"},
        {"max_buffer_size", "hello"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^error processing option \"max_buffer_size\": "
        "Non-digit character found: \"hello\"$");
  }

  {
    auto options = Options{
        {"stream", "stderr"},
        {"max_buffer_size", "0"},
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "^error processing option \"max_buffer_size\": "
        "must be a positive integer$");
  }

  {
    auto options = Options{
        make_pair("stream", "stderr"),
        make_pair("foo", "bar"),
    };
    EXPECT_THROW_RE(
        factory.createHandler(options),
        std::invalid_argument,
        "unknown option \"foo\"");
  }
}
