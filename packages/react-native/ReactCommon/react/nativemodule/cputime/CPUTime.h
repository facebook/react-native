/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef USE_POSIX_TIME
#include <time.h>
#else
#include <chrono>
#endif

#ifdef USE_POSIX_TIME

namespace {
const double NANOSECONDS_IN_A_SECOND = 1000000000;
} // namespace

#endif

namespace facebook::react {

#ifdef USE_POSIX_TIME

inline double getCPUTimeNanos() {
  struct timespec time {};
  clock_gettime(CLOCK_THREAD_CPUTIME_ID, &time);
  return static_cast<double>(time.tv_sec) * NANOSECONDS_IN_A_SECOND +
      static_cast<double>(time.tv_nsec);
}

inline bool hasAccurateCPUTimeNanosForBenchmarks() {
  return true;
}

#else

inline double getCPUTimeNanos() {
  auto now = std::chrono::steady_clock::now();
  return static_cast<double>(
      std::chrono::duration_cast<std::chrono::nanoseconds>(
          now.time_since_epoch())
          .count());
}

inline bool hasAccurateCPUTimeNanosForBenchmarks() {
  return false;
}

#endif

} // namespace facebook::react
