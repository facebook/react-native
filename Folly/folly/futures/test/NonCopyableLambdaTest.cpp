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

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(NonCopyableLambda, basic) {
  Promise<int> promise;
  Future<int> future = promise.getFuture();

  Future<Unit>().thenValue(std::bind(
      [](Promise<int>& p2, folly::Unit) mutable { p2.setValue(123); },
      std::move(promise),
      std::placeholders::_1));

  // The previous statement can be simplified in C++14:
  //  Future<Unit>().then([promise = std::move(promise)]() mutable {
  //    promise.setValue(123);
  //  });

  EXPECT_TRUE(future.isReady());
  EXPECT_EQ(std::move(future).get(), 123);
}

TEST(NonCopyableLambda, unique_ptr) {
  Promise<Unit> promise;
  auto int_ptr = std::make_unique<int>(1);

  EXPECT_EQ(*int_ptr, 1);

  auto future = promise.getFuture().thenValue(std::bind(
      [](std::unique_ptr<int>& p, folly::Unit) mutable {
        ++*p;
        return std::move(p);
      },
      std::move(int_ptr),
      std::placeholders::_1));

  // The previous statement can be simplified in C++14:
  //  auto future =
  //      promise.getFuture().then([int_ptr = std::move(int_ptr)]() mutable {
  //        ++*int_ptr;
  //        return std::move(int_ptr);
  //      });

  EXPECT_FALSE(future.isReady());
  promise.setValue();
  EXPECT_TRUE(future.isReady());
  EXPECT_EQ(*std::move(future).get(), 2);
}

TEST(NonCopyableLambda, Function) {
  Promise<int> promise;

  Function<int(int)> callback = [](int x) { return x + 1; };

  auto future = promise.getFuture().then(std::move(callback));
  EXPECT_THROW(callback(0), std::bad_function_call);

  EXPECT_FALSE(future.isReady());
  promise.setValue(100);
  EXPECT_TRUE(future.isReady());
  EXPECT_EQ(std::move(future).get(), 101);
}

TEST(NonCopyableLambda, FunctionConst) {
  Promise<int> promise;

  Function<int(int) const> callback = [](int x) { return x + 1; };

  auto future = promise.getFuture().then(std::move(callback));
  EXPECT_THROW(callback(0), std::bad_function_call);

  EXPECT_FALSE(future.isReady());
  promise.setValue(100);
  EXPECT_TRUE(future.isReady());
  EXPECT_EQ(std::move(future).get(), 101);
}
