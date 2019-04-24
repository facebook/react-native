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
#include <queue>

#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>
#include <folly/portability/GTest.h>

using namespace folly;

inline void popAndFulfillPromise(
    std::queue<std::shared_ptr<Promise<Unit>>>& ps,
    std::mutex& ps_mutex) {
  ps_mutex.lock();
  auto p = ps.front();
  ps.pop();
  ps_mutex.unlock();
  p->setValue();
}

inline std::function<Future<Unit>(void)> makeThunk(
    std::queue<std::shared_ptr<Promise<Unit>>>& ps,
    int& interrupt,
    std::mutex& ps_mutex) {
  return [&]() mutable {
    auto p = std::make_shared<Promise<Unit>>();
    p->setInterruptHandler(
        [&](exception_wrapper const& /* e */) { ++interrupt; });
    ps_mutex.lock();
    ps.push(p);
    ps_mutex.unlock();

    return p->getFuture();
  };
}

inline std::function<bool(void)> makePred(int& i) {
  return [&]() {
    bool res = i < 3;
    ++i;
    return res;
  };
}

TEST(Times, success) {
  std::queue<std::shared_ptr<Promise<Unit>>> ps;
  std::mutex ps_mutex;
  int interrupt = 0;
  bool complete = false;
  bool failure = false;

  auto thunk = makeThunk(ps, interrupt, ps_mutex);
  auto f = folly::times(3, thunk)
               .thenValue([&](auto&&) mutable { complete = true; })
               .onError([&](FutureException& /* e */) { failure = true; });

  popAndFulfillPromise(ps, ps_mutex);
  EXPECT_FALSE(complete);
  EXPECT_FALSE(failure);

  popAndFulfillPromise(ps, ps_mutex);
  EXPECT_FALSE(complete);
  EXPECT_FALSE(failure);

  popAndFulfillPromise(ps, ps_mutex);
  EXPECT_TRUE(f.isReady());
  EXPECT_TRUE(complete);
  EXPECT_FALSE(failure);
}

TEST(Times, failure) {
  std::queue<std::shared_ptr<Promise<Unit>>> ps;
  std::mutex ps_mutex;
  int interrupt = 0;
  bool complete = false;
  bool failure = false;

  auto thunk = makeThunk(ps, interrupt, ps_mutex);
  auto f = folly::times(3, thunk)
               .thenValue([&](auto&&) mutable { complete = true; })
               .onError([&](FutureException& /* e */) { failure = true; });

  popAndFulfillPromise(ps, ps_mutex);
  EXPECT_FALSE(complete);
  EXPECT_FALSE(failure);

  ps_mutex.lock();
  auto p2 = ps.front();
  ps.pop();
  ps_mutex.unlock();
  FutureException eggs("eggs");
  p2->setException(eggs);

  EXPECT_TRUE(f.isReady());
  EXPECT_FALSE(complete);
  EXPECT_TRUE(failure);
}

TEST(Times, interrupt) {
  std::queue<std::shared_ptr<Promise<Unit>>> ps;
  std::mutex ps_mutex;
  int interrupt = 0;
  bool complete = false;
  bool failure = false;

  auto thunk = makeThunk(ps, interrupt, ps_mutex);
  auto f = folly::times(3, thunk)
               .thenValue([&](auto&&) mutable { complete = true; })
               .onError([&](FutureException& /* e */) { failure = true; });

  EXPECT_EQ(0, interrupt);

  FutureException eggs("eggs");
  f.raise(eggs);

  for (int i = 1; i <= 3; ++i) {
    EXPECT_EQ(1, interrupt);
    popAndFulfillPromise(ps, ps_mutex);
  }
}
