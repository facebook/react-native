/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/synchronization/Baton.h>

#include <thread>

#include <folly/portability/GTest.h>
#include <folly/synchronization/test/BatonTestHelpers.h>
#include <folly/test/DeterministicSchedule.h>

using namespace folly;
using namespace folly::test;
using folly::detail::EmulatedFutexAtomic;
using std::chrono::steady_clock;
using std::chrono::system_clock;

/// Basic test

TEST(Baton, basic_blocking) {
  run_basic_test<true, std::atomic>();
  run_basic_test<true, EmulatedFutexAtomic>();
  run_basic_test<true, DeterministicAtomic>();
}

TEST(Baton, basic_nonblocking) {
  run_basic_test<false, std::atomic>();
  run_basic_test<false, EmulatedFutexAtomic>();
  run_basic_test<false, DeterministicAtomic>();
}

/// Ping pong tests

TEST(Baton, pingpong_blocking) {
  DSched sched(DSched::uniform(0));

  run_pingpong_test<true, DeterministicAtomic>(1000);
}

TEST(Baton, pingpong_nonblocking) {
  DSched sched(DSched::uniform(0));

  run_pingpong_test<false, DeterministicAtomic>(1000);
}

// Timed wait basic system clock tests

TEST(Baton, timed_wait_basic_system_clock_blocking) {
  run_basic_timed_wait_tests<true, std::atomic, system_clock>();
  run_basic_timed_wait_tests<true, EmulatedFutexAtomic, system_clock>();
  run_basic_timed_wait_tests<true, DeterministicAtomic, system_clock>();
}

TEST(Baton, timed_wait_basic_system_clock_nonblocking) {
  run_basic_timed_wait_tests<false, std::atomic, system_clock>();
  run_basic_timed_wait_tests<false, EmulatedFutexAtomic, system_clock>();
  run_basic_timed_wait_tests<false, DeterministicAtomic, system_clock>();
}

// Timed wait timeout system clock tests

TEST(Baton, timed_wait_timeout_system_clock_blocking) {
  run_timed_wait_tmo_tests<true, std::atomic, system_clock>();
  run_timed_wait_tmo_tests<true, EmulatedFutexAtomic, system_clock>();
  run_timed_wait_tmo_tests<true, DeterministicAtomic, system_clock>();
}

TEST(Baton, timed_wait_timeout_system_clock_nonblocking) {
  run_timed_wait_tmo_tests<false, std::atomic, system_clock>();
  run_timed_wait_tmo_tests<false, EmulatedFutexAtomic, system_clock>();
  run_timed_wait_tmo_tests<false, DeterministicAtomic, system_clock>();
}

// Timed wait regular system clock tests

TEST(Baton, timed_wait_system_clock_blocking) {
  run_timed_wait_regular_test<true, std::atomic, system_clock>();
  run_timed_wait_regular_test<true, EmulatedFutexAtomic, system_clock>();
  run_timed_wait_regular_test<true, DeterministicAtomic, system_clock>();
}

TEST(Baton, timed_wait_system_clock_nonblocking) {
  run_timed_wait_regular_test<false, std::atomic, system_clock>();
  run_timed_wait_regular_test<false, EmulatedFutexAtomic, system_clock>();
  run_timed_wait_regular_test<false, DeterministicAtomic, system_clock>();
}

// Timed wait basic steady clock tests

TEST(Baton, timed_wait_basic_steady_clock_blocking) {
  run_basic_timed_wait_tests<true, std::atomic, steady_clock>();
  run_basic_timed_wait_tests<true, EmulatedFutexAtomic, steady_clock>();
  run_basic_timed_wait_tests<true, DeterministicAtomic, steady_clock>();
}

TEST(Baton, timed_wait_basic_steady_clock_nonblocking) {
  run_basic_timed_wait_tests<false, std::atomic, steady_clock>();
  run_basic_timed_wait_tests<false, EmulatedFutexAtomic, steady_clock>();
  run_basic_timed_wait_tests<false, DeterministicAtomic, steady_clock>();
}

// Timed wait timeout steady clock tests

TEST(Baton, timed_wait_timeout_steady_clock_blocking) {
  run_timed_wait_tmo_tests<true, std::atomic, steady_clock>();
  run_timed_wait_tmo_tests<true, EmulatedFutexAtomic, steady_clock>();
  run_timed_wait_tmo_tests<true, DeterministicAtomic, steady_clock>();
}

TEST(Baton, timed_wait_timeout_steady_clock_nonblocking) {
  run_timed_wait_tmo_tests<false, std::atomic, steady_clock>();
  run_timed_wait_tmo_tests<false, EmulatedFutexAtomic, steady_clock>();
  run_timed_wait_tmo_tests<false, DeterministicAtomic, steady_clock>();
}

// Timed wait regular steady clock tests

TEST(Baton, timed_wait_steady_clock_blocking) {
  run_timed_wait_regular_test<true, std::atomic, steady_clock>();
  run_timed_wait_regular_test<true, EmulatedFutexAtomic, steady_clock>();
  run_timed_wait_regular_test<true, DeterministicAtomic, steady_clock>();
}

TEST(Baton, timed_wait_steady_clock_nonblocking) {
  run_timed_wait_regular_test<false, std::atomic, steady_clock>();
  run_timed_wait_regular_test<false, EmulatedFutexAtomic, steady_clock>();
  run_timed_wait_regular_test<false, DeterministicAtomic, steady_clock>();
}

/// Try wait tests

TEST(Baton, try_wait_blocking) {
  run_try_wait_tests<true, std::atomic>();
  run_try_wait_tests<true, EmulatedFutexAtomic>();
  run_try_wait_tests<true, DeterministicAtomic>();
}

TEST(Baton, try_wait_nonblocking) {
  run_try_wait_tests<false, std::atomic>();
  run_try_wait_tests<false, EmulatedFutexAtomic>();
  run_try_wait_tests<false, DeterministicAtomic>();
}
