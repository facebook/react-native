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
#include <folly/logging/printf.h>
#include <folly/logging/test/TestLogHandler.h>
#include <folly/portability/GTest.h>

using namespace folly;
using std::make_shared;

TEST(PrintfTest, printfStyleMacros) {
  LoggerDB db{LoggerDB::TESTING};
  Logger logger{&db, "test"};
  auto* category = logger.getCategory();

  auto handler = make_shared<TestLogHandler>();
  category->addHandler(handler);
  category->setLevel(LogLevel::DBG, true);

  Logger foo{&db, "test.foo.bar"};
  Logger foobar{&db, "test.foo.bar"};
  Logger footest{&db, "test.foo.test"};
  Logger footest1234{&db, "test.foo.test.1234"};
  Logger other{&db, "test.other"};
  db.setLevel("test", LogLevel::ERR);
  db.setLevel("test.foo", LogLevel::DBG2);
  db.setLevel("test.foo.test", LogLevel::DBG7);

  auto& messages = handler->getMessages();

  // test.other's effective level should be INFO, so a DBG0
  // message to it should be discarded
  FB_LOGC(other, DBG0, "this should be discarded: %d", 5);
  ASSERT_EQ(0, messages.size());

  // Disabled log messages should not evaluate their arguments
  bool argumentEvaluated = false;
  auto getValue = [&] {
    argumentEvaluated = true;
    return 5;
  };
  FB_LOGC(foobar, DBG3, "discarded message: %d", getValue());
  EXPECT_FALSE(argumentEvaluated);

  FB_LOGC(foobar, DBG1, "this message should pass: %d", getValue());
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("this message should pass: 5", messages[0].first.getMessage());
  EXPECT_TRUE(argumentEvaluated);
  messages.clear();

  // The FB_LOGC() macro should work even if the format string does not contain
  // any format sequences.  Ideally people would just use FB_LOG() if they
  // aren't actually formatting anything, but making FB_LOGC() work in this
  // scenario still makes it easier for people to switch legacy printf-style
  // code to FB_LOGC().
  FB_LOGC(foobar, DBG1, "no actual format arguments");
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("no actual format arguments", messages[0].first.getMessage());
  messages.clear();

  // Similar checks with XLOGC()
  auto* xlogCategory = XLOG_GET_CATEGORY();
  xlogCategory->addHandler(handler);
  xlogCategory->setLevel(LogLevel::DBG5, true);

  argumentEvaluated = false;
  XLOGC(DBG9, "failing log check: %d", getValue());
  EXPECT_FALSE(argumentEvaluated);

  XLOGC(DBG5, "passing log: %03d", getValue());
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("passing log: 005", messages[0].first.getMessage());
  EXPECT_TRUE(argumentEvaluated);
  messages.clear();

  XLOGC(DBG1, "no xlog format arguments");
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ("no xlog format arguments", messages[0].first.getMessage());
  messages.clear();

  XLOGC_IF(DBG1, false, "no xlog format arguments");
  ASSERT_EQ(0, messages.size());
  XLOGC_IF(DBG1, true, "xlog format arguments");
  ASSERT_EQ(1, messages.size());
  messages.clear();

  argumentEvaluated = false;
  XLOGC_IF(DBG1, true, "xlog format string %d", getValue());
  ASSERT_EQ(1, messages.size());
  EXPECT_TRUE(argumentEvaluated);
  messages.clear();

  argumentEvaluated = false;
  XLOGC_IF(DBG1, false, "xlog format string %d", getValue());
  ASSERT_EQ(0, messages.size());
  EXPECT_FALSE(argumentEvaluated);
  messages.clear();

  // more complex conditional expressions
  std::array<bool, 2> conds = {{false, true}};
  for (unsigned i = 0; i < conds.size(); i++) {
    for (unsigned j = 0; j < conds.size(); j++) {
      argumentEvaluated = false;
      XLOGC_IF(
          DBG1, conds[i] && conds[j], "testing conditional %d", getValue());
      EXPECT_EQ((conds[i] && conds[j]) ? 1 : 0, messages.size());
      messages.clear();
      if (conds[i] && conds[j]) {
        EXPECT_TRUE(argumentEvaluated);
      } else {
        EXPECT_FALSE(argumentEvaluated);
      }

      argumentEvaluated = false;
      XLOGC_IF(
          DBG1, conds[i] || conds[j], "testing conditional %d", getValue());
      EXPECT_EQ((conds[i] || conds[j]) ? 1 : 0, messages.size());
      messages.clear();
      if (conds[i] || conds[j]) {
        EXPECT_TRUE(argumentEvaluated);
      } else {
        EXPECT_FALSE(argumentEvaluated);
      }
    }
  }

  XLOGC_IF(DBG1, 0x6 & 0x2, "More conditional 1");
  EXPECT_EQ(1, messages.size());
  messages.clear();

  XLOGC_IF(DBG1, 0x6 | 0x2, "More conditional 2");
  EXPECT_EQ(1, messages.size());
  messages.clear();

  XLOGC_IF(DBG1, 0x6 | 0x2 ? true : false, "More conditional 3");
  EXPECT_EQ(1, messages.size());
  messages.clear();

  XLOGC_IF(DBG1, 0x6 | 0x2 ? true : false, "More conditional 3");
  EXPECT_EQ(1, messages.size());
  messages.clear();

  XLOGC_IF(DBG1, 0x3 & 0x4 ? true : false, "More conditional 4");
  EXPECT_EQ(0, messages.size());
  messages.clear();

  XLOGC_IF(DBG1, false ? true : false, "More conditional 5");
  EXPECT_EQ(0, messages.size());
  messages.clear();

  // Errors attempting to format the message should not throw
  FB_LOGC(footest1234, ERR, "width overflow: %999999999999999999999d", 5);
  ASSERT_EQ(1, messages.size());
  EXPECT_EQ(
      "error formatting printf-style log message: "
      "width overflow: %999999999999999999999d",
      messages[0].first.getMessage());
  messages.clear();
}
