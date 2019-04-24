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

#include <deque>
#include <mutex>
#include <thread>

#include <folly/portability/GTest.h>
#include <folly/synchronization/CallOnce.h>

static size_t const kNumThreads = 16;

template <typename CallOnceFunc>
void bm_impl(CallOnceFunc&& fn, size_t iters) {
  std::deque<std::thread> threads;
  for (size_t i = 0u; i < kNumThreads; ++i) {
    threads.emplace_back([&fn, iters] {
      for (size_t j = 0u; j < iters; ++j) {
        fn();
      }
    });
  }
  for (std::thread& t : threads) {
    t.join();
  }
}

TEST(FollyCallOnce, Simple) {
  folly::once_flag flag;
  auto fn = [&](int* outp) { ++*outp; };
  int out = 0;
  folly::call_once(flag, fn, &out);
  folly::call_once(flag, fn, &out);
  ASSERT_EQ(1, out);
}

TEST(FollyCallOnce, Exception) {
  struct ExpectedException {};
  folly::once_flag flag;
  size_t numCalls = 0;
  EXPECT_THROW(
      folly::call_once(
          flag,
          [&] {
            ++numCalls;
            throw ExpectedException();
          }),
      ExpectedException);
  EXPECT_EQ(1, numCalls);
  folly::call_once(flag, [&] { ++numCalls; });
  EXPECT_EQ(2, numCalls);
}

TEST(FollyCallOnce, Stress) {
  for (int i = 0; i < 100; ++i) {
    folly::once_flag flag;
    int out = 0;
    bm_impl([&] { folly::call_once(flag, [&] { ++out; }); }, 100);
    ASSERT_EQ(1, out);
  }
}
