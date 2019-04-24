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

#pragma once

#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>
#include <folly/test/DeterministicSchedule.h>

namespace folly {
namespace test {

typedef DeterministicSchedule DSched;

template <bool MayBlock, template <typename> class Atom>
void run_basic_test() {
  Baton<MayBlock, Atom> b;
  b.post();
  b.wait();
}

template <bool MayBlock, template <typename> class Atom>
void run_pingpong_test(int numRounds) {
  using B = Baton<MayBlock, Atom>;
  B batons[17];
  B& a = batons[0];
  B& b = batons[16]; // to get it on a different cache line
  auto thr = DSched::thread([&] {
    for (int i = 0; i < numRounds; ++i) {
      a.wait();
      a.reset();
      b.post();
    }
  });
  for (int i = 0; i < numRounds; ++i) {
    a.post();
    b.wait();
    b.reset();
  }
  DSched::join(thr);
}

template <bool MayBlock, template <typename> class Atom, typename Clock>
void run_basic_timed_wait_tests() {
  Baton<MayBlock, Atom> b;
  b.post();
  // tests if early delivery works fine
  EXPECT_TRUE(b.try_wait_until(Clock::now()));
}

template <bool MayBlock, template <typename> class Atom, typename Clock>
void run_timed_wait_tmo_tests() {
  Baton<MayBlock, Atom> b;

  auto thr = DSched::thread([&] {
    bool rv = b.try_wait_until(Clock::now() + std::chrono::milliseconds(1));
    // main thread is guaranteed to not post until timeout occurs
    EXPECT_FALSE(rv);
  });
  DSched::join(thr);
}

template <bool MayBlock, template <typename> class Atom, typename Clock>
void run_timed_wait_regular_test() {
  Baton<MayBlock, Atom> b;

  auto thr = DSched::thread([&] {
    // To wait forever we'd like to use time_point<Clock>::max, but
    // std::condition_variable does math to convert the timeout to
    // system_clock without handling overflow.
    auto farFuture = Clock::now() + std::chrono::hours(1000);
    bool rv = b.try_wait_until(farFuture);
    if (!std::is_same<Atom<int>, DeterministicAtomic<int>>::value) {
      // DeterministicAtomic ignores actual times, so doesn't guarantee
      // a lack of timeout
      EXPECT_TRUE(rv);
    }
  });

  if (!std::is_same<Atom<int>, DeterministicAtomic<int>>::value) {
    // If we are using std::atomic (or EmulatedFutexAtomic) then
    // a sleep here guarantees to a large extent that 'thr' will
    // execute wait before we post it, thus testing late delivery. For
    // DeterministicAtomic, we just rely on DeterministicSchedule to do
    // the scheduling.  The test won't fail if we lose the race, we just
    // don't get coverage.
    std::this_thread::sleep_for(std::chrono::milliseconds(2));
  }

  b.post();
  DSched::join(thr);
}

template <bool MayBlock, template <typename> class Atom>
void run_try_wait_tests() {
  Baton<MayBlock, Atom> b;
  EXPECT_FALSE(b.ready());
  EXPECT_FALSE(b.try_wait());
  b.post();
  EXPECT_TRUE(b.ready());
  EXPECT_TRUE(b.try_wait());
}

} // namespace test
} // namespace folly
