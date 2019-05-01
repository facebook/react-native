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

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(Poll, ready) {
  Promise<int> p;
  auto f = p.getFuture();
  p.setValue(42);
  EXPECT_EQ(42, f.poll().value().value());
}

TEST(Poll, notReady) {
  Promise<int> p;
  auto f = p.getFuture();
  EXPECT_FALSE(f.poll().hasValue());
}

TEST(Poll, exception) {
  Promise<Unit> p;
  auto f = p.getFuture();
  p.setWith([] { throw std::runtime_error("Runtime"); });
  EXPECT_TRUE(f.poll().value().hasException());
}
