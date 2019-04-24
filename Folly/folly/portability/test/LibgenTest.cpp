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

#include <string>

#include <folly/portability/GTest.h>
#include <folly/portability/Libgen.h>

TEST(Libgen, dirname) {
  auto doDirname = [](const char* str) -> std::string {
    auto tmp = strdup(str); // we need a mutable string for dirname.
    auto ret = std::string(folly::portability::internal_dirname(tmp));
    free(tmp);
    return ret;
  };
  EXPECT_EQ("/usr", doDirname("/usr/lib"));
  EXPECT_EQ("/", doDirname("/usr/"));
  EXPECT_EQ(".", doDirname("usr"));
  EXPECT_EQ("/", doDirname("/"));
  EXPECT_EQ(".", doDirname("."));
  EXPECT_EQ(".", doDirname(".."));
}
