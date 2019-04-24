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
#include <folly/logging/LogCategory.h>

#include <folly/Conv.h>
#include <folly/logging/Logger.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/test/TestLogHandler.h>
#include <folly/portability/GTest.h>

using namespace folly;
using std::make_shared;
using std::shared_ptr;
using std::string;

TEST(LogCategory, effectiveLevel) {
  LoggerDB db{LoggerDB::TESTING};
  Logger foo{&db, "foo"};
  Logger foo2{&db, "..foo.."};
  EXPECT_EQ(foo.getCategory(), foo2.getCategory());

  EXPECT_EQ(kDefaultLogLevel, db.getCategory("")->getLevel());
  EXPECT_EQ(kDefaultLogLevel, db.getCategory("")->getEffectiveLevel());

  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo.bar")->getLevel());
  EXPECT_EQ(kDefaultLogLevel, db.getCategory("foo.bar")->getEffectiveLevel());

  db.setLevel(".foo", LogLevel::DBG0);
  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo.bar")->getLevel());
  EXPECT_EQ(LogLevel::DBG0, db.getCategory("foo.bar")->getEffectiveLevel());

  db.setLevel(".", LogLevel::DBG0);
  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo.bar")->getLevel());
  EXPECT_EQ(LogLevel::DBG0, db.getCategory("foo.bar")->getEffectiveLevel());

  // Test a newly created category under .foo
  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo.test.1234")->getLevel());
  EXPECT_EQ(
      LogLevel::DBG0, db.getCategory("foo.test.1234")->getEffectiveLevel());

  // Test a category that does not inherit its parent's log level
  auto noinherit = db.getCategory("foo.test.noinherit");
  EXPECT_EQ(LogLevel::MAX_LEVEL, noinherit->getLevel());
  EXPECT_EQ(LogLevel::DBG0, noinherit->getEffectiveLevel());
  noinherit->setLevel(LogLevel::CRITICAL, false);
  EXPECT_EQ(LogLevel::CRITICAL, noinherit->getEffectiveLevel());

  // Modify the root logger's level
  db.setLevel(".", LogLevel::ERR);
  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo.test.1234")->getLevel());
  EXPECT_EQ(
      LogLevel::DBG0, db.getCategory("foo.test.1234")->getEffectiveLevel());
  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("foo.test")->getLevel());
  EXPECT_EQ(LogLevel::DBG0, db.getCategory("foo.test")->getEffectiveLevel());
  EXPECT_EQ(LogLevel::DBG0, db.getCategory("foo")->getLevel());
  EXPECT_EQ(LogLevel::DBG0, db.getCategory("foo")->getEffectiveLevel());
  EXPECT_EQ(
      LogLevel::CRITICAL, db.getCategory("foo.test.noinherit")->getLevel());
  EXPECT_EQ(
      LogLevel::CRITICAL,
      db.getCategory("foo.test.noinherit")->getEffectiveLevel());

  EXPECT_EQ(LogLevel::MAX_LEVEL, db.getCategory("bar.foo.test")->getLevel());
  EXPECT_EQ(LogLevel::ERR, db.getCategory("bar.foo.test")->getEffectiveLevel());
}

void testNumHandlers(size_t numHandlers) {
  SCOPED_TRACE(folly::to<string>("num_handlers= ", numHandlers));
  LoggerDB db{LoggerDB::TESTING};
  db.setLevel("", LogLevel::DBG);

  // Create the requested number of handlers for the foo.bar category
  Logger foobar{&db, "foo.bar"};
  std::vector<shared_ptr<TestLogHandler>> handlers;
  for (size_t n = 0; n < numHandlers; ++n) {
    handlers.emplace_back(make_shared<TestLogHandler>());
    foobar.getCategory()->addHandler(handlers.back());
  }

  // Add a handler to the root category, to confirm that messages are
  // propagated up to the root correctly.
  auto rootHandler = make_shared<TestLogHandler>();
  auto rootCategory = db.getCategory("");
  rootCategory->addHandler(rootHandler);

  // Log a message to a child of the foobar category
  Logger childLogger{&db, "foo.bar.child"};
  FB_LOG(childLogger, WARN, "beware");

  // Make sure the message showed up at all of the handlers
  for (const auto& handler : handlers) {
    auto& messages = handler->getMessages();
    ASSERT_EQ(1, messages.size());
    EXPECT_EQ("beware", messages[0].first.getMessage());
    EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
    EXPECT_EQ(childLogger.getCategory(), messages[0].first.getCategory());
    EXPECT_EQ(foobar.getCategory(), messages[0].second);
  }
  {
    auto& messages = rootHandler->getMessages();
    ASSERT_EQ(1, messages.size());
    EXPECT_EQ("beware", messages[0].first.getMessage());
    EXPECT_EQ(LogLevel::WARN, messages[0].first.getLevel());
    EXPECT_EQ(childLogger.getCategory(), messages[0].first.getCategory());
    EXPECT_EQ(rootCategory, messages[0].second);
  }

  // Now log a message directly to foobar
  FB_LOG(foobar, DBG1, "just testing");
  for (const auto& handler : handlers) {
    auto& messages = handler->getMessages();
    ASSERT_EQ(2, messages.size());
    EXPECT_EQ("just testing", messages[1].first.getMessage());
    EXPECT_EQ(LogLevel::DBG1, messages[1].first.getLevel());
    EXPECT_EQ(foobar.getCategory(), messages[1].first.getCategory());
    EXPECT_EQ(foobar.getCategory(), messages[1].second);
  }
  {
    auto& messages = rootHandler->getMessages();
    ASSERT_EQ(2, messages.size());
    EXPECT_EQ("just testing", messages[1].first.getMessage());
    EXPECT_EQ(LogLevel::DBG1, messages[1].first.getLevel());
    EXPECT_EQ(foobar.getCategory(), messages[1].first.getCategory());
    EXPECT_EQ(rootCategory, messages[1].second);
  }

  // Log a message to a sibling of foobar
  Logger siblingLogger{&db, "foo.sibling"};
  FB_LOG(siblingLogger, ERR, "oh noes");
  for (const auto& handler : handlers) {
    auto& messages = handler->getMessages();
    EXPECT_EQ(2, messages.size());
  }
  {
    auto& messages = rootHandler->getMessages();
    ASSERT_EQ(3, messages.size());
    EXPECT_EQ("oh noes", messages[2].first.getMessage());
    EXPECT_EQ(LogLevel::ERR, messages[2].first.getLevel());
    EXPECT_EQ(siblingLogger.getCategory(), messages[2].first.getCategory());
    EXPECT_EQ(rootCategory, messages[2].second);
  }
}

TEST(LogCategory, numHandlers) {
  // The LogCategory code behaves differently when there are 5 or fewer
  // LogHandlers attached to a category vs when ther are more.
  //
  // Test with fewer than 5 handlers.
  testNumHandlers(1);
  testNumHandlers(2);

  // Test with exactly 5 handlers, as well as one fewer and one more, just
  // to make sure we catch any corner cases.
  testNumHandlers(4);
  testNumHandlers(5);
  testNumHandlers(6);

  // Test with significantly more than 5 handlers.
  testNumHandlers(15);
}
