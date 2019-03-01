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

#pragma once

#include <folly/Baton.h>
#include <folly/test/DeterministicSchedule.h>
#include <folly/portability/GTest.h>

namespace folly {
namespace test {

typedef DeterministicSchedule DSched;

template <template <typename> class Atom, bool SinglePoster, bool Blocking>
void run_basic_test() {
  Baton<Atom, SinglePoster, Blocking> b;
  b.post();
  b.wait();
}

template <template <typename> class Atom, bool SinglePoster, bool Blocking>
void run_pingpong_test(int numRounds) {
  using B = Baton<Atom, SinglePoster, Blocking>;
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

template <template <typename> class Atom, typename Clock, bool SinglePoster>
void run_basic_timed_wait_tests() {
  Baton<Atom, SinglePoster> b;
  b.post();
  // tests if early delivery works fine
  EXPECT_TRUE(b.timed_wait(Clock::now()));
}

template <template <typename> class Atom, typename Clock, bool SinglePoster>
void run_timed_wait_tmo_tests() {
  Baton<Atom, SinglePoster> b;

  auto thr = DSched::thread([&] {
    bool rv = b.timed_wait(Clock::now() + std::chrono::milliseconds(1));
    // main thread is guaranteed to not post until timeout occurs
    EXPECT_FALSE(rv);
  });
  DSched::join(thr);
}

template <template <typename> class Atom, typename Clock, bool SinglePoster>
void run_timed_wait_regular_test() {
  Baton<Atom, SinglePoster> b;

  auto thr = DSched::thread([&] {
    // To wait forever we'd like to use time_point<Clock>::max, but
    // std::condition_variable does math to convert the timeout to
    // system_clock without handling overflow.
    auto farFuture = Clock::now() + std::chrono::hours(1000);
    bool rv = b.timed_wait(farFuture);
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

template <template <typename> class Atom, bool SinglePoster, bool Blocking>
void run_try_wait_tests() {
  Baton<Atom, SinglePoster, Blocking> b;
  EXPECT_FALSE(b.try_wait());
  b.post();
  EXPECT_TRUE(b.try_wait());
}

template <template <typename> class Atom, bool SinglePoster, bool Blocking>
void run_multi_producer_tests() {
  constexpr int NPROD = 5;
  Baton<Atom, SinglePoster, Blocking> local_ping[NPROD];
  Baton<Atom, SinglePoster, Blocking> local_pong[NPROD];
  Baton<Atom, /* SingleProducer = */ false, Blocking> global;
  Baton<Atom, SinglePoster, Blocking> shutdown;

  std::thread prod[NPROD];
  for (int i = 0; i < NPROD; ++i) {
    prod[i] = DSched::thread([&, i] {
      if (!std::is_same<Atom<int>, DeterministicAtomic<int>>::value) {
        // If we are using std::atomic (or EmulatedFutexAtomic) then
        // a variable sleep here will make it more likely that
        // global.post()-s will span more than one global.wait() by
        // the consumer thread and for the latter to block (if the
        // global baton is blocking). For DeterministicAtomic, we just
        // rely on DeterministicSchedule to do the scheduling.  The
        // test won't fail if we lose the race, we just don't get
        // coverage.
        for (int j = 0; j < i; ++j) {
          std::this_thread::sleep_for(std::chrono::microseconds(1));
        }
      }
      local_ping[i].post();
      global.post();
      local_pong[i].wait();
    });
  }

  auto cons = DSched::thread([&] {
    while (true) {
      global.wait();
      global.reset();
      if (shutdown.try_wait()) {
        return;
      }
      for (int i = 0; i < NPROD; ++i) {
        if (local_ping.try_wait()) {
          local_ping.reset();
          local_pong.post();
        }
      }
    }
  });

  for (auto& t : prod) {
    DSched::join(t);
  }

  global.post();
  shutdown.post();
  DSched::join(cons);
}

} // namespace test {
} // namespace folly {
