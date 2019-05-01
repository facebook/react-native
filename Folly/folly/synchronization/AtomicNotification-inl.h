/*
 * Copyright 2004-present Facebook, Inc.
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

#include <condition_variable>
#include <cstdint>

namespace folly {
namespace detail {
namespace atomic_notification {
/**
 * We use Futex<std::atomic> as the alias that has the lowest performance
 * overhead with respect to atomic notifications.  Assert that
 * atomic_uint_fast_wait_t is the same as Futex<std::atomic>
 */
static_assert(std::is_same<atomic_uint_fast_wait_t, Futex<std::atomic>>{}, "");

/**
 * Implementation and specializations for the atomic_wait() family of
 * functions
 */
inline std::cv_status toCvStatus(FutexResult result) {
  return (result == FutexResult::TIMEDOUT) ? std::cv_status::timeout
                                           : std::cv_status::no_timeout;
}
inline std::cv_status toCvStatus(ParkResult result) {
  return (result == ParkResult::Timeout) ? std::cv_status::timeout
                                         : std::cv_status::no_timeout;
}

// ParkingLot instantiation for futex management
extern ParkingLot<std::uint32_t> parkingLot;

template <template <typename...> class Atom, typename... Args>
void atomic_wait_impl(
    const Atom<std::uint32_t, Args...>* atomic,
    std::uint32_t expected) {
  futexWait(atomic, expected);
  return;
}

template <template <typename...> class Atom, typename Integer, typename... Args>
void atomic_wait_impl(const Atom<Integer, Args...>* atomic, Integer expected) {
  static_assert(!std::is_same<Integer, std::uint32_t>{}, "");
  parkingLot.park(
      atomic, -1, [&] { return atomic->load() == expected; }, [] {});
}

template <
    template <typename...> class Atom,
    typename... Args,
    typename Clock,
    typename Duration>
std::cv_status atomic_wait_until_impl(
    const Atom<std::uint32_t, Args...>* atomic,
    std::uint32_t expected,
    const std::chrono::time_point<Clock, Duration>& deadline) {
  return toCvStatus(futexWaitUntil(atomic, expected, deadline));
}

template <
    template <typename...> class Atom,
    typename Integer,
    typename... Args,
    typename Clock,
    typename Duration>
std::cv_status atomic_wait_until_impl(
    const Atom<Integer, Args...>* atomic,
    Integer expected,
    const std::chrono::time_point<Clock, Duration>& deadline) {
  static_assert(!std::is_same<Integer, std::uint32_t>{}, "");
  return toCvStatus(parkingLot.park_until(
      atomic, -1, [&] { return atomic->load() == expected; }, [] {}, deadline));
}

template <template <typename...> class Atom, typename... Args>
void atomic_notify_one_impl(const Atom<std::uint32_t, Args...>* atomic) {
  futexWake(atomic, 1);
  return;
}

template <template <typename...> class Atom, typename Integer, typename... Args>
void atomic_notify_one_impl(const Atom<Integer, Args...>* atomic) {
  static_assert(!std::is_same<Integer, std::uint32_t>{}, "");
  parkingLot.unpark(atomic, [&](const auto& data) {
    FOLLY_SAFE_DCHECK(data == std::numeric_limits<std::uint32_t>::max(), "");
    return UnparkControl::RemoveBreak;
  });
}

template <template <typename...> class Atom, typename Integer, typename... Args>
void atomic_notify_all_impl(const Atom<std::uint32_t, Args...>* atomic) {
  futexWake(atomic);
  return;
}

template <template <typename...> class Atom, typename Integer, typename... Args>
void atomic_notify_all_impl(const Atom<Integer, Args...>* atomic) {
  static_assert(!std::is_same<Integer, std::uint32_t>{}, "");
  parkingLot.unpark(atomic, [&](const auto& data) {
    FOLLY_SAFE_DCHECK(data == std::numeric_limits<std::uint32_t>::max(), "");
    return UnparkControl::RemoveContinue;
  });
}
} // namespace atomic_notification
} // namespace detail

template <typename Integer>
void atomic_wait(const std::atomic<Integer>* atomic, Integer expected) {
  detail::atomic_notification::atomic_wait_impl(atomic, expected);
}

template <typename Integer, typename Clock, typename Duration>
std::cv_status atomic_wait_until(
    const std::atomic<Integer>* atomic,
    Integer expected,
    const std::chrono::time_point<Clock, Duration>& deadline) {
  return detail::atomic_notification::atomic_wait_until_impl(
      atomic, expected, deadline);
}

template <typename Integer>
void atomic_notify_one(const std::atomic<Integer>* atomic) {
  detail::atomic_notification::atomic_notify_one_impl(atomic);
}

template <typename Integer>
void atomic_notify_all(const std::atomic<Integer>* atomic) {
  detail::atomic_notification::atomic_notify_all_impl(atomic);
}

} // namespace folly
