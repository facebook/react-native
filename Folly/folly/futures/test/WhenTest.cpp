/*
 * Copyright 2015-present Facebook, Inc.
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

#include <memory>
#include <mutex>

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(When, predicateFalse) {
  int i = 0;
  auto thunk = [&] { return makeFuture().thenValue([&](auto&&) { i += 1; }); };

  // false
  auto f1 = folly::when(false, thunk);
  f1.wait();
  EXPECT_EQ(0, i);
}

TEST(When, predicateTrue) {
  int i = 0;
  auto thunk = [&] { return makeFuture().thenValue([&](auto&&) { i += 1; }); };

  // true
  auto f2 = folly::when(true, thunk);
  f2.wait();
  EXPECT_EQ(1, i);
}
