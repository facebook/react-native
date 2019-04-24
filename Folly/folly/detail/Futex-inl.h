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

#pragma once

#include <folly/detail/Futex.h>
#include <folly/synchronization/ParkingLot.h>

namespace folly {
namespace detail {

/** Optimal when TargetClock is the same type as Clock.
 *
 *  Otherwise, both Clock::now() and TargetClock::now() must be invoked. */
template <typename TargetClock, typename Clock, typename Duration>
typename TargetClock::time_point time_point_conv(
    std::chrono::time_point<Clock, Duration> const& time) {
  using std::chrono::duration_cast;
  using TimePoint = std::chrono::time_point<Clock, Duration>;
  using TargetDuration = typename TargetClock::duration;
  using TargetTimePoint = typename TargetClock::time_point;
  if (time == TimePoint::max()) {
    return TargetTimePoint::max();
  } else if (std::is_same<Clock, TargetClock>::value) {
    // in place of time_point_cast, which cannot compile without if-constexpr
    auto const delta = time.time_since_epoch();
    return TargetTimePoint(duration_cast<TargetDuration>(delta));
  } else {
    // different clocks with different epochs, so non-optimal case
    auto const delta = time - Clock::now();
    return TargetClock::now() + duration_cast<TargetDuration>(delta);
  }
}

/**
 * Available overloads, with definitions elsewhere
 *
 * These functions are treated as ADL-extension points, the templates above
 * call these functions without them having being pre-declared.  This works
 * because ADL lookup finds the definitions of these functions when you pass
 * the relevant arguments
 */
int futexWakeImpl(
    const Futex<std::atomic>* futex,
    int count,
    uint32_t wakeMask);
FutexResult futexWaitImpl(
    const Futex<std::atomic>* futex,
    uint32_t expected,
    std::chrono::system_clock::time_point const* absSystemTime,
    std::chrono::steady_clock::time_point const* absSteadyTime,
    uint32_t waitMask);

int futexWakeImpl(
    const Futex<EmulatedFutexAtomic>* futex,
    int count,
    uint32_t wakeMask);
FutexResult futexWaitImpl(
    const Futex<EmulatedFutexAtomic>* futex,
    uint32_t expected,
    std::chrono::system_clock::time_point const* absSystemTime,
    std::chrono::steady_clock::time_point const* absSteadyTime,
    uint32_t waitMask);

template <typename Futex, typename Deadline>
typename std::enable_if<Deadline::clock::is_steady, FutexResult>::type
futexWaitImpl(
    Futex* futex,
    uint32_t expected,
    Deadline const& deadline,
    uint32_t waitMask) {
  return futexWaitImpl(futex, expected, nullptr, &deadline, waitMask);
}

template <typename Futex, typename Deadline>
typename std::enable_if<!Deadline::clock::is_steady, FutexResult>::type
futexWaitImpl(
    Futex* futex,
    uint32_t expected,
    Deadline const& deadline,
    uint32_t waitMask) {
  return futexWaitImpl(futex, expected, &deadline, nullptr, waitMask);
}

template <typename Futex>
FutexResult
futexWait(const Futex* futex, uint32_t expected, uint32_t waitMask) {
  auto rv = futexWaitImpl(futex, expected, nullptr, nullptr, waitMask);
  assert(rv != FutexResult::TIMEDOUT);
  return rv;
}

template <typename Futex>
int futexWake(const Futex* futex, int count, uint32_t wakeMask) {
  return futexWakeImpl(futex, count, wakeMask);
}

template <typename Futex, class Clock, class Duration>
FutexResult futexWaitUntil(
    const Futex* futex,
    uint32_t expected,
    std::chrono::time_point<Clock, Duration> const& deadline,
    uint32_t waitMask) {
  using Target = typename std::conditional<
      Clock::is_steady,
      std::chrono::steady_clock,
      std::chrono::system_clock>::type;
  auto const converted = time_point_conv<Target>(deadline);
  return converted == Target::time_point::max()
      ? futexWaitImpl(futex, expected, nullptr, nullptr, waitMask)
      : futexWaitImpl(futex, expected, converted, waitMask);
}

} // namespace detail
} // namespace folly
