/*
 * Copyright 2012-present Facebook, Inc.
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

#include <chrono>
#include <cstdint>
#include <type_traits>

namespace folly {
namespace detail {

/*
 * Helper function to compute the average, given a specified input type and
 * return type.
 */

// If the input is long double, divide using long double to avoid losing
// precision.
template <typename ReturnType>
ReturnType avgHelper(long double sum, uint64_t count) {
  if (count == 0) {
    return ReturnType(0);
  }
  const long double countf = count;
  return static_cast<ReturnType>(sum / countf);
}

// In all other cases divide using double precision.
// This should be relatively fast, and accurate enough for most use cases.
template <typename ReturnType, typename ValueType>
typename std::enable_if<
    !std::is_same<typename std::remove_cv<ValueType>::type, long double>::value,
    ReturnType>::type
avgHelper(ValueType sum, uint64_t count) {
  if (count == 0) {
    return ReturnType(0);
  }
  const double sumf = double(sum);
  const double countf = double(count);
  return static_cast<ReturnType>(sumf / countf);
}

/*
 * Helper function to compute the rate per Interval,
 * given the specified count recorded over the elapsed time period.
 */
template <
    typename ReturnType = double,
    typename Duration = std::chrono::seconds,
    typename Interval = Duration>
ReturnType rateHelper(ReturnType count, Duration elapsed) {
  if (elapsed == Duration(0)) {
    return 0;
  }

  // Use std::chrono::duration_cast to convert between the native
  // duration and the desired interval.  However, convert the rates,
  // rather than just converting the elapsed duration.  Converting the
  // elapsed time first may collapse it down to 0 if the elapsed interval
  // is less than the desired interval, which will incorrectly result in
  // an infinite rate.
  typedef std::chrono::duration<
      ReturnType,
      std::ratio<Duration::period::den, Duration::period::num>>
      NativeRate;
  typedef std::chrono::duration<
      ReturnType,
      std::ratio<Interval::period::den, Interval::period::num>>
      DesiredRate;

  NativeRate native(count / elapsed.count());
  DesiredRate desired = std::chrono::duration_cast<DesiredRate>(native);
  return desired.count();
}

template <typename T>
struct Bucket {
 public:
  typedef T ValueType;

  Bucket() : sum(ValueType()), count(0) {}

  void clear() {
    sum = ValueType();
    count = 0;
  }

  void add(const ValueType& s, uint64_t c) {
    // TODO: It would be nice to handle overflow here.
    sum += s;
    count += c;
  }

  Bucket& operator+=(const Bucket& o) {
    add(o.sum, o.count);
    return *this;
  }

  Bucket& operator-=(const Bucket& o) {
    // TODO: It would be nice to handle overflow here.
    sum -= o.sum;
    count -= o.count;
    return *this;
  }

  template <typename ReturnType>
  ReturnType avg() const {
    return avgHelper<ReturnType>(sum, count);
  }

  ValueType sum;
  uint64_t count;
};
} // namespace detail
} // namespace folly
