// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

namespace facebook {
namespace react {

inline static long getTime() {
#ifdef ANDROID
  static const int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
  static const int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

  // Since SystemClock.uptimeMillis() is commonly used for performance
  // measurement in Java and uptimeMillis() internally uses
  // clock_gettime(CLOCK_MONOTONIC), we use the same API here. We need that to
  // make sure we use the same time system on both JS and Java sides. Links to
  // the source code:
  // https://android.googlesource.com/platform/frameworks/native/+/jb-mr1-release/libs/utils/SystemClock.cpp
  // https://android.googlesource.com/platform/system/core/+/master/libutils/Timers.cpp
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC, &now);
  int64_t nano = now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec;
  return nano / (double)NANOSECONDS_IN_MILLISECOND;
#else
  return 0l;
#endif
}

} // namespace react
} // namespace facebook
