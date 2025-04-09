/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>

namespace facebook::react {

// `DOMHighResTimeStamp` represents a time value in milliseconds (time point or
// duration), with sub-millisecond precision.
// On the Web, the precision can be reduced for security purposes, but that is
// not necessary in React Native.
using DOMHighResTimeStamp = double;

constexpr DOMHighResTimeStamp DOM_HIGH_RES_TIME_STAMP_UNSET = -1.0;

// A unix time stamp in microseconds (μs) that is used in Tracing. All timeline
// events of the Performance panel in DevTools are in this time base.
// https://chromedevtools.github.io/devtools-protocol/tot/Tracing/
using TracingTimeStamp = uint64_t;

inline DOMHighResTimeStamp chronoToDOMHighResTimeStamp(
    std::chrono::steady_clock::duration duration) {
  return static_cast<std::chrono::duration<double, std::milli>>(duration)
      .count();
}

inline DOMHighResTimeStamp chronoToDOMHighResTimeStamp(
    std::chrono::steady_clock::time_point timePoint) {
  return chronoToDOMHighResTimeStamp(timePoint.time_since_epoch());
}

inline TracingTimeStamp chronoToTracingTimeStamp(
    std::chrono::steady_clock::time_point timePoint) {
  return std::chrono::duration_cast<std::chrono::microseconds>(
             timePoint.time_since_epoch())
      .count();
}

} // namespace facebook::react
