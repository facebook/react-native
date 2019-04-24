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
#include <folly/logging/LogStream.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(LogStream, simple) {
  LogStream ls{nullptr};
  ls << "test";
  ls << " foobar";

  EXPECT_EQ("test foobar", ls.extractString());
}

TEST(LogStream, largeMessage) {
  std::string largeString(4096, 'a');

  LogStream ls{nullptr};
  ls << "prefix ";
  ls << largeString;
  ls << " suffix";

  EXPECT_EQ("prefix " + largeString + " suffix", ls.extractString());
}
