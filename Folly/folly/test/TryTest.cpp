/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/Memory.h>
#include <folly/Try.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(Try, basic) {
  class A {
   public:
    A(int x) : x_(x) {}

    int x() const {
      return x_;
    }
   private:
    int x_;
  };

  A a(5);
  Try<A> t_a(std::move(a));

  Try<Unit> t_void;

  EXPECT_EQ(5, t_a.value().x());
}

// Make sure we can copy Trys for copyable types
TEST(Try, copy) {
  Try<int> t;
  auto t2 = t;
}

// But don't choke on move-only types
TEST(Try, moveOnly) {
  Try<std::unique_ptr<int>> t;
  std::vector<Try<std::unique_ptr<int>>> v;
  v.reserve(10);
}

TEST(Try, makeTryWith) {
  auto func = []() {
    return folly::make_unique<int>(1);
  };

  auto result = makeTryWith(func);
  EXPECT_TRUE(result.hasValue());
  EXPECT_EQ(*result.value(), 1);
}

TEST(Try, makeTryWithThrow) {
  auto func = []() -> std::unique_ptr<int> {
    throw std::runtime_error("Runtime");
  };

  auto result = makeTryWith(func);
  EXPECT_TRUE(result.hasException<std::runtime_error>());
}

TEST(Try, makeTryWithVoid) {
  auto func = []() {
    return;
  };

  auto result = makeTryWith(func);
  EXPECT_TRUE(result.hasValue());
}

TEST(Try, makeTryWithVoidThrow) {
  auto func = []() {
    throw std::runtime_error("Runtime");
  };

  auto result = makeTryWith(func);
  EXPECT_TRUE(result.hasException<std::runtime_error>());
}
