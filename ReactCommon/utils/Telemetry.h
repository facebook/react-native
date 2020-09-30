/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>

namespace facebook {
namespace react {

/*
 * Represents a monotonic clock suitable for measuring intervals.
 */
using TelemetryClock = std::chrono::steady_clock;

/*
 * Represents a point in time satisfied the requirements of TelemetryClock.
 */
using TelemetryTimePoint = TelemetryClock::time_point;

/*
 * Represents a time interval satisfied the requirements of TelemetryClock.
 */
using TelemetryDuration = std::chrono::nanoseconds;

/*
 * Represents a time point which never happens.
 */
static TelemetryTimePoint const kTelemetryUndefinedTimePoint =
    TelemetryTimePoint::max();

/*
 * Returns a time point representing the current point in time.
 */
static inline TelemetryTimePoint telemetryTimePointNow() {
  return TelemetryClock::now();
}

/*
 * Returns a number of milliseconds that passed from some epoch starting time
 * point to a given time point. The epoch starting time point is not specified
 * but stays the same for an application run.
 */
static inline int64_t telemetryTimePointToMilliseconds(
    TelemetryTimePoint timePoint) {
  return std::chrono::duration_cast<std::chrono::milliseconds>(
             timePoint - TelemetryTimePoint{})
      .count();
}

/*
 * Returns a number of milliseconds that represents the given duration object.
 */
static inline int64_t telemetryDurationToMilliseconds(
    TelemetryDuration duration) {
  return std::chrono::duration_cast<std::chrono::milliseconds>(duration)
      .count();
}

} // namespace react
} // namespace facebook
