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

#include <folly/Baton.h>
#include <folly/test/BatonTestHelpers.h>
#include <folly/test/DeterministicSchedule.h>
#include <folly/portability/GTest.h>

#include <thread>

using namespace folly;
using namespace folly::test;
using folly::detail::EmulatedFutexAtomic;

/// Basic test

TEST(Baton, basic_single_poster_blocking) {
  run_basic_test<std::atomic, true, true>();
  run_basic_test<EmulatedFutexAtomic, true, true>();
  run_basic_test<DeterministicAtomic, true, true>();
}

TEST(Baton, basic_single_poster_nonblocking) {
  run_basic_test<std::atomic, true, false>();
  run_basic_test<EmulatedFutexAtomic, true, false>();
  run_basic_test<DeterministicAtomic, true, false>();
}

TEST(Baton, basic_multi_poster_blocking) {
  run_basic_test<std::atomic, false, true>();
}

TEST(Baton, basic_multi_poster_nonblocking) {
  run_basic_test<std::atomic, false, false>();
}

/// Ping pong tests

TEST(Baton, pingpong_single_poster_blocking) {
  DSched sched(DSched::uniform(0));

  run_pingpong_test<DeterministicAtomic, true, true>(1000);
}

TEST(Baton, pingpong_single_poster_nonblocking) {
  DSched sched(DSched::uniform(0));

  run_pingpong_test<DeterministicAtomic, true, false>(1000);
}

TEST(Baton, pingpong_multi_poster_blocking) {
  DSched sched(DSched::uniform(0));

  run_pingpong_test<DeterministicAtomic, false, true>(1000);
}

TEST(Baton, pingpong_multi_poster_nonblocking) {
  DSched sched(DSched::uniform(0));

  run_pingpong_test<DeterministicAtomic, false, false>(1000);
}

/// Timed wait tests - Nonblocking Baton does not support timed_wait()

// Timed wait basic system clock tests

TEST(Baton, timed_wait_basic_system_clock_single_poster) {
  run_basic_timed_wait_tests<std::atomic, std::chrono::system_clock, true>();
  run_basic_timed_wait_tests<
      EmulatedFutexAtomic,
      std::chrono::system_clock,
      true>();
  run_basic_timed_wait_tests<
      DeterministicAtomic,
      std::chrono::system_clock,
      true>();
}

TEST(Baton, timed_wait_basic_system_clock_multi_poster) {
  run_basic_timed_wait_tests<std::atomic, std::chrono::system_clock, false>();
  run_basic_timed_wait_tests<
      EmulatedFutexAtomic,
      std::chrono::system_clock,
      false>();
  run_basic_timed_wait_tests<
      DeterministicAtomic,
      std::chrono::system_clock,
      false>();
}

// Timed wait timeout system clock tests

TEST(Baton, timed_wait_timeout_system_clock_single_poster) {
  run_timed_wait_tmo_tests<std::atomic, std::chrono::system_clock, true>();
  run_timed_wait_tmo_tests<
      EmulatedFutexAtomic,
      std::chrono::system_clock,
      true>();
  run_timed_wait_tmo_tests<
      DeterministicAtomic,
      std::chrono::system_clock,
      true>();
}

TEST(Baton, timed_wait_timeout_system_clock_multi_poster) {
  run_timed_wait_tmo_tests<std::atomic, std::chrono::system_clock, false>();
  run_timed_wait_tmo_tests<
      EmulatedFutexAtomic,
      std::chrono::system_clock,
      false>();
  run_timed_wait_tmo_tests<
      DeterministicAtomic,
      std::chrono::system_clock,
      false>();
}

// Timed wait regular system clock tests

TEST(Baton, timed_wait_system_clock_single_poster) {
  run_timed_wait_regular_test<std::atomic, std::chrono::system_clock, true>();
  run_timed_wait_regular_test<
      EmulatedFutexAtomic,
      std::chrono::system_clock,
      true>();
  run_timed_wait_regular_test<
      DeterministicAtomic,
      std::chrono::system_clock,
      true>();
}

TEST(Baton, timed_wait_system_clock_multi_poster) {
  run_timed_wait_regular_test<std::atomic, std::chrono::system_clock, false>();
  run_timed_wait_regular_test<
      EmulatedFutexAtomic,
      std::chrono::system_clock,
      false>();
  run_timed_wait_regular_test<
      DeterministicAtomic,
      std::chrono::system_clock,
      false>();
}

// Timed wait basic steady clock tests

TEST(Baton, timed_wait_basic_steady_clock_single_poster) {
  run_basic_timed_wait_tests<std::atomic, std::chrono::steady_clock, true>();
  run_basic_timed_wait_tests<
      EmulatedFutexAtomic,
      std::chrono::steady_clock,
      true>();
  run_basic_timed_wait_tests<
      DeterministicAtomic,
      std::chrono::steady_clock,
      true>();
}

TEST(Baton, timed_wait_basic_steady_clock_multi_poster) {
  run_basic_timed_wait_tests<std::atomic, std::chrono::steady_clock, false>();
  run_basic_timed_wait_tests<
      EmulatedFutexAtomic,
      std::chrono::steady_clock,
      false>();
  run_basic_timed_wait_tests<
      DeterministicAtomic,
      std::chrono::steady_clock,
      false>();
}

// Timed wait timeout steady clock tests

TEST(Baton, timed_wait_timeout_steady_clock_single_poster) {
  run_timed_wait_tmo_tests<std::atomic, std::chrono::steady_clock, true>();
  run_timed_wait_tmo_tests<
      EmulatedFutexAtomic,
      std::chrono::steady_clock,
      true>();
  run_timed_wait_tmo_tests<
      DeterministicAtomic,
      std::chrono::steady_clock,
      true>();
}

TEST(Baton, timed_wait_timeout_steady_clock_multi_poster) {
  run_timed_wait_tmo_tests<std::atomic, std::chrono::steady_clock, false>();
  run_timed_wait_tmo_tests<
      EmulatedFutexAtomic,
      std::chrono::steady_clock,
      false>();
  run_timed_wait_tmo_tests<
      DeterministicAtomic,
      std::chrono::steady_clock,
      false>();
}

// Timed wait regular steady clock tests

TEST(Baton, timed_wait_steady_clock_single_poster) {
  run_timed_wait_regular_test<std::atomic, std::chrono::steady_clock, true>();
  run_timed_wait_regular_test<
      EmulatedFutexAtomic,
      std::chrono::steady_clock,
      true>();
  run_timed_wait_regular_test<
      DeterministicAtomic,
      std::chrono::steady_clock,
      true>();
}

TEST(Baton, timed_wait_steady_clock_multi_poster) {
  run_timed_wait_regular_test<std::atomic, std::chrono::steady_clock, false>();
  run_timed_wait_regular_test<
      EmulatedFutexAtomic,
      std::chrono::steady_clock,
      false>();
  run_timed_wait_regular_test<
      DeterministicAtomic,
      std::chrono::steady_clock,
      false>();
}

/// Try wait tests

TEST(Baton, try_wait_single_poster_blocking) {
  run_try_wait_tests<std::atomic, true, true>();
  run_try_wait_tests<EmulatedFutexAtomic, true, true>();
  run_try_wait_tests<DeterministicAtomic, true, true>();
}

TEST(Baton, try_wait_single_poster_nonblocking) {
  run_try_wait_tests<std::atomic, true, false>();
  run_try_wait_tests<EmulatedFutexAtomic, true, false>();
  run_try_wait_tests<DeterministicAtomic, true, false>();
}

TEST(Baton, try_wait_multi_poster_blocking) {
  run_try_wait_tests<std::atomic, false, true>();
  run_try_wait_tests<EmulatedFutexAtomic, false, true>();
  run_try_wait_tests<DeterministicAtomic, false, true>();
}

TEST(Baton, try_wait_multi_poster_nonblocking) {
  run_try_wait_tests<std::atomic, false, false>();
  run_try_wait_tests<EmulatedFutexAtomic, false, false>();
  run_try_wait_tests<DeterministicAtomic, false, false>();
}

/// Multi-producer tests

TEST(Baton, multi_producer_single_poster_blocking) {
  run_try_wait_tests<std::atomic, true, true>();
  run_try_wait_tests<EmulatedFutexAtomic, true, true>();
  run_try_wait_tests<DeterministicAtomic, true, true>();
}

TEST(Baton, multi_producer_single_poster_nonblocking) {
  run_try_wait_tests<std::atomic, true, false>();
  run_try_wait_tests<EmulatedFutexAtomic, true, false>();
  run_try_wait_tests<DeterministicAtomic, true, false>();
}

TEST(Baton, multi_producer_multi_poster_blocking) {
  run_try_wait_tests<std::atomic, false, true>();
  run_try_wait_tests<EmulatedFutexAtomic, false, true>();
  run_try_wait_tests<DeterministicAtomic, false, true>();
}

TEST(Baton, multi_producer_multi_poster_nonblocking) {
  run_try_wait_tests<std::atomic, false, false>();
  run_try_wait_tests<EmulatedFutexAtomic, false, false>();
  run_try_wait_tests<DeterministicAtomic, false, false>();
}
