/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/Range.h>

#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>
#include <algorithm>

using namespace std;
using namespace folly;

TEST(CaseInsensitiveMatch, CompareWithLegacy) {
  AsciiCaseInsensitive cmp;
  for (int i = 0; i < (1 << 8); i++) {
    EXPECT_TRUE(cmp(tolower(i), toupper(i)));
    EXPECT_TRUE(cmp(toupper(i), tolower(i)));
  }
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
