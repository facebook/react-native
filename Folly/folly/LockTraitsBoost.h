/*
 * Copyright 2016-present Facebook, Inc.
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

/**
 * This file contains LockTraits specializations for boost mutex types.
 *
 * These need to be specialized simply due to the fact that the timed
 * methods take boost::chrono arguments instead of std::chrono.
 */
#pragma once

#include <boost/thread.hpp>
#include <folly/LockTraits.h>

#if FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES

namespace folly {

namespace detail {
/// Convert a std::chrono::duration argument to boost::chrono::duration
template <class Rep, std::intmax_t Num, std::intmax_t Denom>
boost::chrono::duration<Rep, boost::ratio<Num, Denom>> toBoostDuration(
    const std::chrono::duration<Rep, std::ratio<Num, Denom>>& d) {
  return boost::chrono::duration<Rep, boost::ratio<Num, Denom>>(d.count());
}
} // namespace detail

/**
 * LockTraits specialization for boost::shared_mutex
 */
template <>
struct LockTraits<boost::shared_mutex>
    : public LockTraitsBase<boost::shared_mutex> {
  static constexpr bool is_shared = true;
  static constexpr bool is_timed = true;

  template <class Rep, class Period>
  static bool try_lock_for(
      boost::shared_mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_for(detail::toBoostDuration(timeout));
  }

  template <class Rep, class Period>
  static bool try_lock_shared_for(
      boost::shared_mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_shared_for(detail::toBoostDuration(timeout));
  }
};

/**
 * LockTraits specialization for boost::timed_mutex
 */
template <>
struct LockTraits<boost::timed_mutex>
    : public LockTraitsBase<boost::timed_mutex> {
  static constexpr bool is_shared = false;
  static constexpr bool is_timed = true;

  template <class Rep, class Period>
  static bool try_lock_for(
      boost::timed_mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_for(detail::toBoostDuration(timeout));
  }
};

/**
 * LockTraits specialization for boost::recursive_timed_mutex
 */
template <>
struct LockTraits<boost::recursive_timed_mutex>
    : public LockTraitsBase<boost::recursive_timed_mutex> {
  static constexpr bool is_shared = false;
  static constexpr bool is_timed = true;

  template <class Rep, class Period>
  static bool try_lock_for(
      boost::recursive_timed_mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_for(detail::toBoostDuration(timeout));
  }
};
} // namespace folly

#endif // FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES
