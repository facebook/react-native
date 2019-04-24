/*
 * Copyright 2016-present Facebook, Inc.
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

#include <glog/logging.h>

#include <folly/portability/GTest.h>
#include <folly/system/Shell.h>

using namespace folly;

TEST(Shell, ShellQuote) {
  EXPECT_EQ(shellQuote("a"), "'a'");
  EXPECT_EQ(shellQuote("a'b"), "'a'\\''b'");
  EXPECT_EQ(shellQuote("a\"b"), "'a\"b'");
}

TEST(Shell, Shellify) {
  auto command = "rm -rf /"_shellify();
  EXPECT_EQ(command[0], "/bin/sh");
  EXPECT_EQ(command[1], "-c");
  EXPECT_EQ(command[2], "rm -rf /");

  command = "rm -rf {}"_shellify("someFile.txt");
  EXPECT_EQ(command[2], "rm -rf 'someFile.txt'");

  command = "rm -rf {}"_shellify(5);
  EXPECT_EQ(command[2], "rm -rf '5'");

  command = "ls {}"_shellify("blah'; rm -rf /");
  EXPECT_EQ(command[2], "ls 'blah'\\''; rm -rf /'");
}

// Tests for the deprecated shellify() function.
// Don't warn about using this deprecated function in the test for it.
FOLLY_PUSH_WARNING
FOLLY_GNU_DISABLE_WARNING("-Wdeprecated-declarations")
TEST(Shell, Shellify_deprecated) {
  auto command = shellify("rm -rf /");
  EXPECT_EQ(command[0], "/bin/sh");
  EXPECT_EQ(command[1], "-c");
  EXPECT_EQ(command[2], "rm -rf /");

  command = shellify("rm -rf {}", "someFile.txt");
  EXPECT_EQ(command[2], "rm -rf 'someFile.txt'");

  command = shellify("rm -rf {}", 5);
  EXPECT_EQ(command[2], "rm -rf '5'");

  command = shellify("ls {}", "blah'; rm -rf /");
  EXPECT_EQ(command[2], "ls 'blah'\\''; rm -rf /'");
}
FOLLY_POP_WARNING
