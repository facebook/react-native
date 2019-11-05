/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if defined(__unix__) || (defined(__APPLE__) && defined(__MACH__))

// It's Unix
#include <time.h>
#include <unistd.h>

#endif

#if defined(__APPLE__) && defined(__MACH__)

// It's iOS or macOS or one of derivatives.
#include <dispatch/dispatch.h>
#include <mach/mach.h>
#include <mach/mach_time.h>

#endif

namespace facebook {
namespace react {

inline static int64_t monotonicTimeInMilliseconds() {
#if defined(__APPLE__) && defined(__MACH__)

  static struct mach_timebase_info tb_info = {0};
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    __unused int ret = mach_timebase_info(&tb_info);
    assert(0 == ret);
  });

  return (mach_absolute_time() * tb_info.numer) / tb_info.denom / 1000000;

#elif defined(_POSIX_MONOTONIC_CLOCK)

  // It's Unix with MONOTONIC_CLOCK support (e.g. Android)

  constexpr static int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
  constexpr static int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

  // Since SystemClock.uptimeMillis() is commonly used for performance
  // measurement in Java and uptimeMillis() internally uses
  // clock_gettime(CLOCK_MONOTONIC), we use the same API here. We need that to
  // make sure we use the same time system on both JS and Java sides. Links to
  // the source code:
  // https://android.googlesource.com/platform/frameworks/native/+/jb-mr1-release/libs/utils/SystemClock.cpp
  // https://android.googlesource.com/platform/system/core/+/master/libutils/Timers.cpp
  struct timespec now;

  clock_gettime(CLOCK_MONOTONIC, &now);

  return (now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec) /
      NANOSECONDS_IN_MILLISECOND;

#else

  It's Unix *without* MONOTONIC_CLOCK support or Microsoft Windows.
  If you run this on Microsoft Windows, could you please implement the
  function using some Windows-specific APIs, and submit a PR?
  https://stackoverflow.com/questions/5404277/porting-clock-gettime-to-windows

#endif
}

} // namespace react
} // namespace facebook
