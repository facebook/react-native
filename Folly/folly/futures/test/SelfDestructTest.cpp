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

#include <folly/executors/InlineExecutor.h>
#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(SelfDestruct, then) {
  auto* p = new Promise<int>();
  auto future = p->getFuture().then([p](int x) {
    delete p;
    return x + 1;
  });
  p->setValue(123);
  EXPECT_EQ(124, std::move(future).get());
}

TEST(SelfDestruct, ensure) {
  auto* p = new Promise<int>();
  auto future = p->getFuture().ensure([p] { delete p; });
  p->setValue(123);
  EXPECT_EQ(123, std::move(future).get());
}

class ThrowingExecutorError : public std::runtime_error {
 public:
  using std::runtime_error::runtime_error;
};

class ThrowingExecutor : public folly::Executor {
 public:
  void add(folly::Func) override {
    throw ThrowingExecutorError("ThrowingExecutor::add");
  }
};

TEST(SelfDestruct, throwingExecutor) {
  ThrowingExecutor executor;
  auto* p = new Promise<int>();
  auto future =
      p->getFuture().via(&executor).onError([p](ThrowingExecutorError const&) {
        delete p;
        return 456;
      });
  p->setValue(123);
  EXPECT_EQ(456, std::move(future).get());
}

TEST(SelfDestruct, throwingInlineExecutor) {
  InlineExecutor executor;

  auto* p = new Promise<int>();
  auto future = p->getFuture()
                    .via(&executor)
                    .thenValue([p](auto &&) -> int {
                      delete p;
                      throw ThrowingExecutorError("callback throws");
                    })
                    .onError([](ThrowingExecutorError const&) { return 456; });
  p->setValue(123);
  EXPECT_EQ(456, std::move(future).get());
}
