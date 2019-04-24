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

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

#include <thread>

using namespace folly;

namespace {
struct Widget {
  int v_;
  /* implicit */ Widget(int v) : v_(v) {}
  Widget(const Widget& other) = default;
  Widget(Widget&& other) noexcept = default;
  Widget& operator=(const Widget& /* other */) {
    throw std::logic_error("unexpected copy assignment");
  }
  Widget& operator=(Widget&& /* other */) {
    throw std::logic_error("unexpected move assignment");
  }
  explicit operator int() && {
    return v_;
  }
};
} // namespace

TEST(ConverstionOperator, DirectInitialization) {
  auto future = makeFuture<Widget>(23);
  EXPECT_EQ(future.value().v_, 23);
  Future<int> secondFuture{std::move(future)};
  EXPECT_EQ(secondFuture.value(), 23);
}

TEST(ConverstionOperator, StaticCast) {
  auto future = makeFuture<Widget>(23);
  EXPECT_EQ(future.value().v_, 23);
  EXPECT_EQ(static_cast<Future<int>>(std::move(future)).value(), 23);
}
