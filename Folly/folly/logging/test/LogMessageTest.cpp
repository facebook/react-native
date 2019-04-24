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
#include <folly/logging/LogMessage.h>

#include <folly/String.h>
#include <folly/logging/Logger.h>
#include <folly/logging/LoggerDB.h>
#include <folly/portability/GTest.h>

using namespace folly;

#define CHECK_MSG(expected, value, hasNewlines)                               \
  {                                                                           \
    SCOPED_TRACE(                                                             \
        "input string: \"" + folly::backslashify<std::string>(value) + "\""); \
    LogMessage checkMsg{category,                                             \
                        LogLevel::ERR,                                        \
                        __FILE__,                                             \
                        __LINE__,                                             \
                        __func__,                                             \
                        std::string{value}};                                  \
    EXPECT_EQ(expected, checkMsg.getMessage());                               \
    EXPECT_EQ(static_cast<int>(hasNewlines), checkMsg.containsNewlines());    \
    EXPECT_EQ(__FILE__, checkMsg.getFileName());                              \
    EXPECT_EQ(__LINE__, checkMsg.getLineNumber());                            \
  }

TEST(LogMessage, sanitize) {
  LoggerDB db{LoggerDB::TESTING};
  Logger logger{&db, "test"};
  auto* category = logger.getCategory();

  CHECK_MSG("foo", "foo", false);
  CHECK_MSG("foo\\\\bar", "foo\\bar", false);
  CHECK_MSG("foo\\x01test", "foo\01test", false);
  CHECK_MSG("test 1234 ", "test 1234 ", false);
  CHECK_MSG("\\x07", "\a", false);
  CHECK_MSG("\n", "\n", true);
  CHECK_MSG("\t", "\t", false);
  CHECK_MSG("\n\t\n", "\n\t\n", true);
  // Test strings containing NUL bytes
  CHECK_MSG("test\\x00.1234\\x00", std::string("test\0.1234\0", 11), false);
  CHECK_MSG("test\\x00\n1234\\x00", std::string("test\0\n1234\0", 11), true);
  // Test all ASCII characters except NUL
  CHECK_MSG(
      ("\\x01\\x02\\x03\\x04\\x05\\x06\\x07\\x08"
       "\t\n\\x0b\\x0c\\x0d\\x0e\\x0f"
       "\\x10\\x11\\x12\\x13\\x14\\x15\\x16\\x17"
       "\\x18\\x19\\x1a\\x1b\\x1c\\x1d\\x1e\\x1f"
       " !\"#$%&'()*+,-./0123456789:;<=>?"
       "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\\\]^_"
       "`abcdefghijklmnopqrstuvwxyz{|}~\\x7f"),
      ("\001\002\003\004\005\006\007"
       "\010\011\012\013\014\015\016\017"
       "\020\021\022\023\024\025\026\027"
       "\030\031\032\033\034\035\036\037"
       " !\"#$%&'()*+,-./0123456789:;<=>?"
       "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_"
       "`abcdefghijklmnopqrstuvwxyz{|}~\177"),
      true);

  // Test some high-bit characters
  CHECK_MSG("\x82\x83", "\x82\x83", false);
  CHECK_MSG("\x82\n\x83\n", "\x82\n\x83\n", true);
  CHECK_MSG("\x82\n\\x0c\x83\n", "\x82\n\f\x83\n", true);
}
