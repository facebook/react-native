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

#include <folly/test/TestUtils.h>
#include <queue>

#include <folly/logging/Init.h>
#include <folly/logging/LogConfigParser.h>
#include <folly/logging/LogHandlerFactory.h>
#include <folly/logging/LogWriter.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/StandardLogHandler.h>
#include <folly/logging/StandardLogHandlerFactory.h>
#include <folly/logging/xlog.h>

namespace folly {

class TestLogWriter : public LogWriter {
 public:
  void writeMessage(folly::StringPiece /* buffer */, uint32_t /* flags */ = 0)
      override {
    unflushed_messages_count++;
  }

  void flush() override {
    flushed_messages_count += unflushed_messages_count;
    unflushed_messages_count = 0;
  }

  int flushed_messages_count{0};
  int unflushed_messages_count{0};

  bool ttyOutput() const override {
    return false;
  }
};

class TestHandlerFactory : public LogHandlerFactory {
 public:
  TestHandlerFactory(const std::shared_ptr<TestLogWriter> writer)
      : writer_(writer) {}

  StringPiece getType() const override {
    return "test";
  }

  std::shared_ptr<LogHandler> createHandler(const Options& options) override {
    TestWriterFactory writerFactory{writer_};
    return StandardLogHandlerFactory::createHandler(
        getType(), &writerFactory, options);
  }

 private:
  std::shared_ptr<TestLogWriter> writer_;
  class TestWriterFactory : public StandardLogHandlerFactory::WriterFactory {
   public:
    TestWriterFactory(std::shared_ptr<TestLogWriter> writer)
        : writer_(writer) {}

    bool processOption(StringPiece /* name */, StringPiece /* value */)
        override {
      return false;
    }

    std::shared_ptr<LogWriter> createWriter() override {
      return writer_;
    }

   private:
    std::shared_ptr<TestLogWriter> writer_;
  };
};

} // namespace folly

using namespace folly;

namespace {
class SyncLevelTest : public testing::Test {
 public:
  SyncLevelTest() {
    writer = std::make_shared<TestLogWriter>();
    db.registerHandlerFactory(
        std::make_unique<TestHandlerFactory>(writer), true);
    db.resetConfig(
        parseLogConfig("test=INFO:default; default=test:sync_level=WARN"));
  }

  LoggerDB db{LoggerDB::TESTING};
  Logger logger{&db, "test"};
  std::shared_ptr<TestLogWriter> writer;
};
} // namespace

TEST_F(SyncLevelTest, NoLogTest) {
  FB_LOG(logger, DBG9) << "DBG9";
  FB_LOG(logger, DBG1) << "DBG1";
  FB_LOG(logger, DBG0) << "DBG0";

  EXPECT_EQ(writer->unflushed_messages_count, 0);
  EXPECT_EQ(writer->flushed_messages_count, 0);
}

TEST_F(SyncLevelTest, SimpleAsyncTest) {
  FB_LOG(logger, INFO) << "INFO";
  FB_LOG(logger, INFO) << "INFO";
  FB_LOG(logger, INFO) << "INFO";
  FB_LOG(logger, INFO) << "INFO";

  EXPECT_EQ(writer->unflushed_messages_count, 4);
  EXPECT_EQ(writer->flushed_messages_count, 0);

  FB_LOG(logger, WARN) << "WARN";

  EXPECT_EQ(writer->unflushed_messages_count, 0);
  EXPECT_EQ(writer->flushed_messages_count, 5);

  FB_LOG(logger, DBG0) << "DBG0";
  FB_LOG(logger, INFO9) << "INFO9";

  EXPECT_EQ(writer->unflushed_messages_count, 1);
  EXPECT_EQ(writer->flushed_messages_count, 5);

  FB_LOG(logger, INFO) << "INFO";
  FB_LOG(logger, WARN) << "WARN";

  EXPECT_EQ(writer->unflushed_messages_count, 0);
  EXPECT_EQ(writer->flushed_messages_count, 8);

  FB_LOG(logger, INFO) << "INFO";
  FB_LOG(logger, CRITICAL) << "CRITICAL";

  EXPECT_EQ(writer->unflushed_messages_count, 0);
  EXPECT_EQ(writer->flushed_messages_count, 10);
}
