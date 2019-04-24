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
#include <folly/logging/Logger.h>
#include <folly/logging/LogCategory.h>
#include <folly/logging/LogHandler.h>
#include <folly/logging/LogMessage.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/test/TestLogHandler.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

using namespace folly;
using std::make_shared;
using testing::MatchesRegex;

class LoggerTest : public ::testing::Test {
 protected:
  void SetUp() override {
    auto* category = logger_.getCategory();

    handler_ = make_shared<TestLogHandler>();
    category->addHandler(handler_);
    category->setLevel(LogLevel::DBG, true);
  }

  static StringPiece pathBasename(StringPiece path) {
    auto idx = path.rfind('/');
    if (idx == StringPiece::npos) {
      return path.str();
    }
    return path.subpiece(idx + 1);
  }

  LoggerDB db_{LoggerDB::TESTING};
  Logger logger_{&db_, "test"};
  std::shared_ptr<TestLogHandler> handler_;
};

TEST_F(LoggerTest, basic) {
  // Simple log message
  auto expectedLine = __LINE__ + 1;
  FB_LOG(logger_, WARN, "hello world");

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("hello world", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(expectedLine, messages[0].first.getLineNumber());
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, subCategory) {
  // Log from a sub-category.
  Logger subLogger{&db_, "test.foo.bar"};
  auto expectedLine = __LINE__ + 1;
  FB_LOG(subLogger, ERR, "sub-category\nlog message");

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("sub-category\nlog message", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(expectedLine, messages[0].first.getLineNumber());
  EXPECT_EQ(LogLevel::ERR, messages[0].first.getLevel());
  EXPECT_TRUE(messages[0].first.containsNewlines());
  EXPECT_EQ(subLogger.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, formatMessage) {
  auto expectedLine = __LINE__ + 1;
  FB_LOGF(logger_, WARN, "num events: {:06d}, duration: {:6.3f}", 1234, 5.6789);

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ(
      "num events: 001234, duration:  5.679", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(expectedLine, messages[0].first.getLineNumber());
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, follyFormatError) {
  // If we pass in a bogus format string, logf() should not throw.
  // It should instead log a message, just complaining about the format error.
  FB_LOGF(
      logger_, WARN, "param1: {:06d}, param2: {:6.3f}", 1234, "hello world!");

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  // Use a regex match here, since the type IDs are reported slightly
  // differently on different platforms.
  EXPECT_THAT(
      messages[0].first.getMessage(),
      MatchesRegex(
          R"(error formatting log message: )"
          R"(invalid format argument \{:6.3f\}: invalid specifier 'f'; )"
          R"(format string: "param1: \{:06d\}, param2: \{:6.3f\}", )"
          R"(arguments: \((.*: )?1234\), \((.*: )?hello world\!\))"));
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, toString) {
  // Use the log API that calls folly::to<string>
  auto expectedLine = __LINE__ + 1;
  FB_LOG(logger_, DBG5, "status=", 5, " name=", "foobar");

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("status=5 name=foobar", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(expectedLine, messages[0].first.getLineNumber());
  EXPECT_EQ(LogLevel::DBG5, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

class ToStringFailure {};
class FormattableButNoToString {};

// clang-format off
[[noreturn]] void toAppend(
    const ToStringFailure& /* arg */,
    std::string* /* result */) {
  throw std::runtime_error(
      "error converting ToStringFailure object to a string");
}

namespace folly {
template <>
class FormatValue<ToStringFailure> {
 public:
  explicit FormatValue(ToStringFailure) {}

  template <class FormatCallback>
  void format(FormatArg& arg, FormatCallback& cb) const {
    FormatValue<std::string>("ToStringFailure").format(arg, cb);
  }
};

template <>
class FormatValue<FormattableButNoToString> {
 public:
  explicit FormatValue(FormattableButNoToString) {}

  template <class FormatCallback>
  void format(FormatArg&, FormatCallback&) const {
    throw std::runtime_error("test");
  }
};
} // namespace folly
// clang-format on

TEST_F(LoggerTest, toStringError) {
  // Use the folly::to<string> log API, with an object that will throw
  // an exception when we try to convert it to a string.
  //
  // The logging code should not throw, but should instead log a message
  // with some detail about the failure.
  ToStringFailure obj;
  auto expectedLine = __LINE__ + 1;
  FB_LOG(logger_, DBG1, "status=", obj, " name=", "foobar");

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ(
      "error constructing log message: "
      "error converting ToStringFailure object to a string",
      messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(expectedLine, messages[0].first.getLineNumber());
  EXPECT_EQ(LogLevel::DBG1, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, formatFallbackError) {
  // Check the behavior if logf() fails, and toAppend() also fails.
  ToStringFailure obj;
  FB_LOGF(logger_, WARN, "param1: {}, param2: {}, {}", 1234, obj);

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_THAT(
      messages[0].first.getMessage(),
      MatchesRegex(
          R"(error formatting log message: invalid format argument \{\}: )"
          R"(argument index out of range, max=2; )"
          R"(format string: "param1: \{\}, param2: \{\}, \{\}", )"
          R"(arguments: \((.*: )?1234\), )"
          R"(\((.*ToStringFailure.*: )?<error_converting_to_string>\))"));
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, formatFallbackUnsupported) {
  // Check the behavior if logf() fails, and toAppend() also fails.
  FormattableButNoToString obj;
  FB_LOGF(logger_, WARN, "param1: {}, param2: {}", 1234, obj);

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_THAT(
      messages[0].first.getMessage(),
      MatchesRegex(
          R"(error formatting log message: test; )"
          R"(format string: "param1: \{\}, param2: \{\}", )"
          R"(arguments: \((.*: )?1234\), )"
          R"(\((.*FormattableButNoToString.*: )?<no_string_conversion>\))"));
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, streamingArgs) {
  auto& messages = handler_->getMessages();

  // Test with only streaming arguments
  std::string foo = "bar";
  FB_LOG(logger_, WARN) << "foo=" << foo << ", test=0x" << std::hex << 35;
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("foo=bar, test=0x23", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
  messages.clear();

  // Test with both function-style and streaming arguments
  FB_LOG(logger_, WARN, "foo=", foo) << " hello, "
                                     << "world: " << 34;
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("foo=bar hello, world: 34", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
  messages.clear();

  // Test with format-style and streaming arguments
  FB_LOGF(logger_, WARN, "foo={}, x={}", foo, 34) << ", also " << 12;
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("foo=bar, x=34, also 12", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
  messages.clear();
}

TEST_F(LoggerTest, escapeSequences) {
  // Escape characters (and any other unprintable characters) in the log
  // message should be escaped when logged.
  auto expectedLine = __LINE__ + 1;
  FB_LOG(logger_, WARN, "hello \033[34mworld\033[0m!");

  auto& messages = handler_->getMessages();
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("hello \\x1b[34mworld\\x1b[0m!", messages[0].first.getMessage());
  EXPECT_EQ("LoggerTest.cpp", pathBasename(messages[0].first.getFileName()));
  EXPECT_EQ(expectedLine, messages[0].first.getLineNumber());
  EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
  EXPECT_FALSE(messages[0].first.containsNewlines());
  EXPECT_EQ(logger_.getCategory(), messages[0].first.getCategory());
  EXPECT_EQ(logger_.getCategory(), messages[0].second);
}

TEST_F(LoggerTest, logMacros) {
  Logger foo{&db_, "test.foo.bar"};
  Logger foobar{&db_, "test.foo.bar"};
  Logger footest{&db_, "test.foo.test"};
  Logger footest1234{&db_, "test.foo.test.1234"};
  Logger other{&db_, "test.other"};
  db_.setLevel("test", LogLevel::ERR);
  db_.setLevel("test.foo", LogLevel::DBG2);
  db_.setLevel("test.foo.test", LogLevel::DBG7);

  auto& messages = handler_->getMessages();

  // test.other's effective level should be INFO, so a DBG0
  // message to it should be discarded
  FB_LOG(other, DBG0, "this should be discarded");
  ASSERT_EQ(0, messages.size());

  // Disabled log messages should not evaluate their arguments
  bool argumentEvaluated = false;
  auto getValue = [&] {
    argumentEvaluated = true;
    return 5;
  };
  FB_LOG(foobar, DBG3, "discarded message: ", getValue());
  EXPECT_FALSE(argumentEvaluated);

  FB_LOG(foobar, DBG1, "this message should pass: ", getValue());
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("this message should pass: 5", messages[0].first.getMessage());
  EXPECT_TRUE(argumentEvaluated);
  messages.clear();

  // Similar checks with FB_LOGF()
  argumentEvaluated = false;
  FB_LOGF(footest1234, DBG9, "failing log check: {}", getValue());
  EXPECT_FALSE(argumentEvaluated);

  FB_LOGF(footest1234, DBG5, "passing log: {:03}", getValue());
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("passing log: 005", messages[0].first.getMessage());
  EXPECT_TRUE(argumentEvaluated);
  messages.clear();

  // Bad format arguments should not throw
  FB_LOGF(footest1234, ERR, "whoops: {}, {}", getValue());
  ASSERT_EQ(1, messages.size());
  EXPECT_THAT(
      messages[0].first.getMessage(),
      MatchesRegex(
          R"(error formatting log message: invalid format argument \{\}: )"
          R"(argument index out of range, max=1; )"
          R"(format string: "whoops: \{\}, \{\}", arguments: \((.*: )?5\))"));
  messages.clear();
}

TEST_F(LoggerTest, logRawMacros) {
  Logger foobar{&db_, "test.foo.bar"};
  db_.setLevel("test.foo", LogLevel::DBG2);

  auto& messages = handler_->getMessages();

  FB_LOG_RAW(
      foobar,
      LogLevel::DBG1,
      "src/some/file.c",
      1234,
      "testFunction",
      "hello",
      ' ',
      1)
      << " world";
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("hello 1 world", messages[0].first.getMessage());
  EXPECT_EQ("src/some/file.c", messages[0].first.getFileName());
  EXPECT_EQ("file.c", messages[0].first.getFileBaseName());
  EXPECT_EQ(1234, messages[0].first.getLineNumber());
  messages.clear();

  auto level = LogLevel::DBG1;
  FB_LOGF_RAW(
      foobar,
      level,
      "test/mytest.c",
      99,
      "testFunction",
      "{}: num={}",
      "test",
      42)
      << " plus extra stuff";
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("test: num=42 plus extra stuff", messages[0].first.getMessage());
  EXPECT_EQ("test/mytest.c", messages[0].first.getFileName());
  EXPECT_EQ("mytest.c", messages[0].first.getFileBaseName());
  EXPECT_EQ(99, messages[0].first.getLineNumber());
  messages.clear();
}
