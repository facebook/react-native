/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/detail/Futex.h>
#include <folly/test/DeterministicSchedule.h>

#include <chrono>
#include <condition_variable>
#include <functional>
#include <ratio>
#include <thread>

#include <glog/logging.h>

#include <folly/Chrono.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Time.h>

using namespace folly::detail;
using namespace folly::test;
using namespace std;
using namespace std::chrono;
using folly::chrono::coarse_steady_clock;

typedef DeterministicSchedule DSched;

template <template <typename> class Atom>
void run_basic_thread(Futex<Atom>& f) {
  EXPECT_EQ(FutexResult::AWOKEN, futexWait(&f, 0));
}

template <template <typename> class Atom>
void run_basic_tests() {
  Futex<Atom> f(0);

  EXPECT_EQ(FutexResult::VALUE_CHANGED, futexWait(&f, 1));
  EXPECT_EQ(futexWake(&f), 0);

  auto thr = DSched::thread(std::bind(run_basic_thread<Atom>, std::ref(f)));

  while (futexWake(&f) != 1) {
    std::this_thread::yield();
  }

  DSched::join(thr);
}

template <template <typename> class Atom, typename Clock, typename Duration>
void liveClockWaitUntilTests() {
  Futex<Atom> f(0);

  for (int stress = 0; stress < 1000; ++stress) {
    auto fp = &f; // workaround for t5336595
    auto thrA = DSched::thread([fp, stress] {
      while (true) {
        const auto deadline = time_point_cast<Duration>(
            Clock::now() + microseconds(1 << (stress % 20)));
        const auto res = futexWaitUntil(fp, 0, deadline);
        EXPECT_TRUE(res == FutexResult::TIMEDOUT || res == FutexResult::AWOKEN);
        if (res == FutexResult::AWOKEN) {
          break;
        }
      }
    });

    while (futexWake(&f) != 1) {
      std::this_thread::yield();
    }

    DSched::join(thrA);
  }

  {
    const auto start = Clock::now();
    const auto deadline = time_point_cast<Duration>(start + milliseconds(100));
    EXPECT_EQ(futexWaitUntil(&f, 0, deadline), FutexResult::TIMEDOUT);
    LOG(INFO) << "Futex wait timed out after waiting for "
              << duration_cast<milliseconds>(Clock::now() - start).count()
              << "ms using clock with " << Duration::period::den
              << " precision, should be ~100ms";
  }

  {
    const auto start = Clock::now();
    const auto deadline =
        time_point_cast<Duration>(start - 2 * start.time_since_epoch());
    EXPECT_EQ(futexWaitUntil(&f, 0, deadline), FutexResult::TIMEDOUT);
    LOG(INFO) << "Futex wait with invalid deadline timed out after waiting for "
              << duration_cast<milliseconds>(Clock::now() - start).count()
              << "ms using clock with " << Duration::period::den
              << " precision, should be ~0ms";
  }
}

template <typename Clock>
void deterministicAtomicWaitUntilTests() {
  Futex<DeterministicAtomic> f(0);

  // Futex wait must eventually fail with either FutexResult::TIMEDOUT or
  // FutexResult::INTERRUPTED
  const auto res = futexWaitUntil(&f, 0, Clock::now() + milliseconds(100));
  EXPECT_TRUE(res == FutexResult::TIMEDOUT || res == FutexResult::INTERRUPTED);
}

template <template <typename> class Atom>
void run_wait_until_tests() {
  liveClockWaitUntilTests<Atom, system_clock, system_clock::duration>();
  liveClockWaitUntilTests<Atom, steady_clock, steady_clock::duration>();
  liveClockWaitUntilTests<Atom, steady_clock, coarse_steady_clock::duration>();

  typedef duration<int64_t, std::ratio<1, 10000000>> decimicroseconds;
  liveClockWaitUntilTests<Atom, system_clock, decimicroseconds>();
}

template <>
void run_wait_until_tests<DeterministicAtomic>() {
  deterministicAtomicWaitUntilTests<system_clock>();
  deterministicAtomicWaitUntilTests<steady_clock>();
  deterministicAtomicWaitUntilTests<coarse_steady_clock>();
}

uint64_t diff(uint64_t a, uint64_t b) {
  return a > b ? a - b : b - a;
}

void run_system_clock_test() {
  /* Test to verify that system_clock uses clock_gettime(CLOCK_REALTIME, ...)
   * for the time_points */
  struct timespec ts;
  const int maxIters = 1000;
  int iter = 0;
  const uint64_t delta = 10000000 /* 10 ms */;

  /** The following loop is only to make the test more robust in the presence of
   * clock adjustments that can occur. We just run the loop maxIter times and
   * expect with very high probability that there will be atleast one iteration
   * of the test during which clock adjustments > delta have not occurred. */
  while (iter < maxIters) {
    uint64_t a =
        duration_cast<nanoseconds>(system_clock::now().time_since_epoch())
            .count();

    clock_gettime(CLOCK_REALTIME, &ts);
    uint64_t b = ts.tv_sec * 1000000000ULL + ts.tv_nsec;

    uint64_t c =
        duration_cast<nanoseconds>(system_clock::now().time_since_epoch())
            .count();

    if (diff(a, b) <= delta && diff(b, c) <= delta && diff(a, c) <= 2 * delta) {
      /* Success! system_clock uses CLOCK_REALTIME for time_points */
      break;
    }
    iter++;
  }
  EXPECT_TRUE(iter < maxIters);
}

void run_steady_clock_test() {
  /* Test to verify that steady_clock uses clock_gettime(CLOCK_MONOTONIC, ...)
   * for the time_points */
  EXPECT_TRUE(steady_clock::is_steady);

  const uint64_t A =
      duration_cast<nanoseconds>(steady_clock::now().time_since_epoch())
          .count();

  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);
  const uint64_t B = ts.tv_sec * 1000000000ULL + ts.tv_nsec;

  const uint64_t C =
      duration_cast<nanoseconds>(steady_clock::now().time_since_epoch())
          .count();
  EXPECT_TRUE(A <= B && B <= C);
}

template <template <typename> class Atom>
void run_wake_blocked_test() {
  for (auto delay = std::chrono::milliseconds(1);; delay *= 2) {
    bool success = false;
    Futex<Atom> f(0);
    auto thr = DSched::thread(
        [&] { success = FutexResult::AWOKEN == futexWait(&f, 0); });
    /* sleep override */ std::this_thread::sleep_for(delay);
    f.store(1);
    futexWake(&f, 1);
    DSched::join(thr);
    LOG(INFO) << "delay=" << delay.count() << "_ms, success=" << success;
    if (success) {
      break;
    }
  }
}

TEST(Futex, clock_source) {
  run_system_clock_test();

  /* On some systems steady_clock is just an alias for system_clock. So,
   * we must skip run_steady_clock_test if the two clocks are the same. */
  if (!std::is_same<system_clock, steady_clock>::value) {
    run_steady_clock_test();
  }
}

TEST(Futex, basic_live) {
  run_basic_tests<std::atomic>();
  run_wait_until_tests<std::atomic>();
}

TEST(Futex, basic_emulated) {
  run_basic_tests<EmulatedFutexAtomic>();
  run_wait_until_tests<EmulatedFutexAtomic>();
}

TEST(Futex, basic_deterministic) {
  DSched sched(DSched::uniform(0));
  run_basic_tests<DeterministicAtomic>();
  run_wait_until_tests<DeterministicAtomic>();
}

TEST(Futex, wake_blocked_live) {
  run_wake_blocked_test<std::atomic>();
}

TEST(Futex, wake_blocked_emulated) {
  run_wake_blocked_test<EmulatedFutexAtomic>();
}
