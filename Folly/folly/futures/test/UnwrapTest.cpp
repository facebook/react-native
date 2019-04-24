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

// A simple scenario for the unwrap call, when the promise was fulfilled
// before calling to unwrap.
TEST(Unwrap, simpleScenario) {
  Future<int> encapsulated_future = makeFuture(5484);
  Future<Future<int>> future = makeFuture(std::move(encapsulated_future));
  EXPECT_EQ(5484, std::move(future).unwrap().value());
}

// Makes sure that unwrap() works when chaning Future's commands.
TEST(Unwrap, chainCommands) {
  Future<Future<int>> future = makeFuture(makeFuture(5484));
  auto unwrapped = std::move(future).unwrap().then([](int i) { return i; });
  EXPECT_EQ(5484, unwrapped.value());
}

// Makes sure that the unwrap call also works when the promise was not yet
// fulfilled, and that the returned Future<T> becomes ready once the promise
// is fulfilled.
TEST(Unwrap, futureNotReady) {
  Promise<Future<int>> p;
  Future<Future<int>> future = p.getFuture();
  Future<int> unwrapped = std::move(future).unwrap();
  // Sanity - should not be ready before the promise is fulfilled.
  ASSERT_FALSE(unwrapped.isReady());
  // Fulfill the promise and make sure the unwrapped future is now ready.
  p.setValue(makeFuture(5484));
  ASSERT_TRUE(unwrapped.isReady());
  EXPECT_EQ(5484, unwrapped.value());
}
