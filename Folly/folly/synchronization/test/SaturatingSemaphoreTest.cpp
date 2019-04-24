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

#include <folly/synchronization/SaturatingSemaphore.h>
#include <folly/portability/GTest.h>
#include <folly/test/DeterministicSchedule.h>

/// Test helper functions

using folly::SaturatingSemaphore;
using DSched = folly::test::DeterministicSchedule;

template <bool MayBlock, template <typename> class Atom = std::atomic>
void run_basic_test() {
  SaturatingSemaphore<MayBlock, Atom> f;
  ASSERT_FALSE(f.ready());
  ASSERT_FALSE(f.try_wait());
  ASSERT_FALSE(f.try_wait_until(
      std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
  ASSERT_FALSE(f.try_wait_until(
      std::chrono::steady_clock::now() + std::chrono::microseconds(1),
      f.wait_options().spin_max(std::chrono::microseconds(1))));
  f.post();
  f.post();
  f.wait();
  f.wait(f.wait_options().spin_max(std::chrono::nanoseconds(100)));
  ASSERT_TRUE(f.ready());
  ASSERT_TRUE(f.try_wait());
  ASSERT_TRUE(f.try_wait_until(
      std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
  f.wait();
  f.reset();
  ASSERT_FALSE(f.try_wait());
}

template <bool MayBlock, template <typename> class Atom = std::atomic>
void run_pingpong_test(int numRounds) {
  using WF = SaturatingSemaphore<MayBlock, Atom>;
  std::array<WF, 17> flags;
  WF& a = flags[0];
  WF& b = flags[16]; // different cache line
  auto thr = DSched::thread([&] {
    for (int i = 0; i < numRounds; ++i) {
      a.try_wait();
      a.wait();
      a.reset();
      b.post();
    }
  });
  for (int i = 0; i < numRounds; ++i) {
    a.post();
    b.try_wait();
    b.wait();
    b.reset();
  }
  DSched::join(thr);
}

template <bool MayBlock, template <typename> class Atom = std::atomic>
void run_multi_poster_multi_waiter_test(int np, int nw) {
  SaturatingSemaphore<MayBlock, Atom> f;
  std::atomic<int> posted{0};
  std::atomic<int> waited{0};
  std::atomic<bool> go_post{false};
  std::atomic<bool> go_wait{false};

  std::vector<std::thread> prod(np);
  std::vector<std::thread> cons(nw);
  for (int i = 0; i < np; ++i) {
    prod[i] = DSched::thread([&] {
      while (!go_post.load()) {
        /* spin */;
      }
      f.post();
      posted.fetch_add(1);
    });
  }

  for (int i = 0; i < nw; ++i) {
    cons[i] = DSched::thread([&] {
      ASSERT_FALSE(f.ready());
      ASSERT_FALSE(f.try_wait());
      ASSERT_FALSE(f.try_wait_for(std::chrono::microseconds(1)));
      ASSERT_FALSE(f.try_wait_until(
          std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
      ASSERT_FALSE(f.try_wait_until(
          std::chrono::steady_clock::now() + std::chrono::microseconds(1),
          f.wait_options().spin_max(std::chrono::microseconds(0))));
      waited.fetch_add(1);
      while (!go_wait.load()) {
        /* spin */;
      }
      ASSERT_TRUE(f.ready());
      ASSERT_TRUE(f.try_wait());
      ASSERT_TRUE(f.try_wait_for(std::chrono::microseconds(1)));
      ASSERT_TRUE(f.try_wait_until(
          std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
      ASSERT_TRUE(f.try_wait_until(
          std::chrono::steady_clock::now() + std::chrono::microseconds(1),
          f.wait_options().spin_max(std::chrono::microseconds(0))));
      f.wait();
    });
  }

  while (waited.load() < nw) {
    /* spin */;
  }
  go_post.store(true);
  while (posted.load() < np) {
    /* spin */;
  }
  go_wait.store(true);

  for (auto& t : prod) {
    DSched::join(t);
  }
  for (auto& t : cons) {
    DSched::join(t);
  }
}

/// Tests

TEST(SaturatingSemaphore, basic_spin_only) {
  run_basic_test<false>();
}

TEST(SaturatingSemaphore, basic_may_block) {
  run_basic_test<true>();
}

TEST(SaturatingSemaphore, pingpong_spin_only) {
  run_pingpong_test<false>(1000);
}

TEST(SaturatingSemaphore, pingpong_may_block) {
  run_pingpong_test<true>(1000);
}

TEST(SaturatingSemaphore, multi_poster_multi_waiter_spin_only) {
  run_multi_poster_multi_waiter_test<false>(1, 1);
  run_multi_poster_multi_waiter_test<false>(1, 10);
  run_multi_poster_multi_waiter_test<false>(10, 1);
  run_multi_poster_multi_waiter_test<false>(10, 10);
}

TEST(SaturatingSemaphore, multi_poster_multi_waiter_may_block) {
  run_multi_poster_multi_waiter_test<true>(1, 1);
  run_multi_poster_multi_waiter_test<true>(1, 10);
  run_multi_poster_multi_waiter_test<true>(10, 1);
  run_multi_poster_multi_waiter_test<true>(10, 10);
}
