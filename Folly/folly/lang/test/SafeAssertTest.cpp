/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/lang/SafeAssert.h>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/portability/GTest.h>

using namespace folly;

// clang-format off
[[noreturn]] void fail() {
  FOLLY_SAFE_CHECK(0 + 0, "hello");
}
// clang-format on

void succeed() {
  FOLLY_SAFE_CHECK(1, "world");
}

TEST(SafeAssert, AssertionFailure) {
  succeed();
  EXPECT_DEATH(fail(), "Assertion failure: 0 \\+ 0");
  EXPECT_DEATH(fail(), "Message: hello");
}
