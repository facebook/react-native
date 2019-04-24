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
#include <folly/logging/StandardLogHandler.h>

#include <folly/Conv.h>
#include <folly/logging/LogCategory.h>
#include <folly/logging/LogFormatter.h>
#include <folly/logging/LogHandlerConfig.h>
#include <folly/logging/LogLevel.h>
#include <folly/logging/LogMessage.h>
#include <folly/logging/LogWriter.h>
#include <folly/logging/LoggerDB.h>
#include <folly/portability/GTest.h>

using namespace folly;
using std::make_shared;

namespace {
class TestLogFormatter : public LogFormatter {
 public:
  std::string formatMessage(
      const LogMessage& message,
      const LogCategory* handlerCategory) override {
    return folly::to<std::string>(
        logLevelToString(message.getLevel()),
        "::",
        message.getCategory()->getName(),
        "::",
        handlerCategory->getName(),
        "::",
        message.getFileName(),
        "::",
        message.getLineNumber(),
        "::",
        message.getMessage());
  }
};

class TestLogWriter : public LogWriter {
 public:
  void writeMessage(folly::StringPiece buffer, uint32_t /* flags */ = 0)
      override {
    messages_.emplace_back(buffer.str());
  }
  void flush() override {}

  std::vector<std::string>& getMessages() {
    return messages_;
  }
  const std::vector<std::string>& getMessages() const {
    return messages_;
  }

  bool ttyOutput() const override {
    return false;
  }

 private:
  std::vector<std::string> messages_;
};
} // namespace

TEST(StandardLogHandler, simple) {
  auto writer = make_shared<TestLogWriter>();
  LogHandlerConfig config{"std_test"};
  StandardLogHandler handler(config, make_shared<TestLogFormatter>(), writer);

  LoggerDB db{LoggerDB::TESTING};
  auto logCategory = db.getCategory("log_cat");
  auto handlerCategory = db.getCategory("handler_cat");

  LogMessage msg{logCategory,
                 LogLevel::DBG8,
                 "src/test.cpp",
                 1234,
                 "testMethod",
                 std::string{"hello world"}};
  handler.handleMessage(msg, handlerCategory);
  ASSERT_EQ(1, writer->getMessages().size());
  EXPECT_EQ(
      "DBG8::log_cat::handler_cat::src/test.cpp::1234::hello world",
      writer->getMessages()[0]);
}

TEST(StandardLogHandler, levelCheck) {
  auto writer = make_shared<TestLogWriter>();
  LogHandlerConfig config{"std_test"};
  StandardLogHandler handler(config, make_shared<TestLogFormatter>(), writer);

  LoggerDB db{LoggerDB::TESTING};
  auto logCategory = db.getCategory("log_cat");
  auto handlerCategory = db.getCategory("handler_cat");

  auto logMsg = [&](LogLevel level, folly::StringPiece message) {
    LogMessage msg{
        logCategory, level, "src/test.cpp", 1234, "testMethod", message};
    handler.handleMessage(msg, handlerCategory);
  };

  handler.setLevel(LogLevel::WARN);
  logMsg(LogLevel::INFO, "info");
  logMsg(LogLevel::WARN, "beware");
  logMsg(LogLevel::ERR, "whoops");
  logMsg(LogLevel::DBG1, "debug stuff");

  auto& messages = writer->getMessages();
  ASSERT_EQ(2, messages.size());
  EXPECT_EQ(
      "WARN::log_cat::handler_cat::src/test.cpp::1234::beware", messages.at(0));
  EXPECT_EQ(
      "ERR::log_cat::handler_cat::src/test.cpp::1234::whoops", messages.at(1));
  messages.clear();

  handler.setLevel(LogLevel::DBG2);
  logMsg(LogLevel::DBG3, "dbg");
  logMsg(LogLevel::DBG1, "here");
  logMsg(LogLevel::DBG2, "and here");
  logMsg(LogLevel::ERR, "oh noes");
  logMsg(LogLevel::DBG9, "very verbose");

  ASSERT_EQ(3, messages.size());
  EXPECT_EQ(
      "DBG1::log_cat::handler_cat::src/test.cpp::1234::here", messages.at(0));
  EXPECT_EQ(
      "DBG2::log_cat::handler_cat::src/test.cpp::1234::and here",
      messages.at(1));
  EXPECT_EQ(
      "ERR::log_cat::handler_cat::src/test.cpp::1234::oh noes", messages.at(2));
  messages.clear();
}
