/*
 * Copyright 2017-present Facebook, Inc.
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
 * Conversions between std::chrono types and POSIX time types.
 *
 * These conversions will fail with a ConversionError if an overflow would
 * occur performing the conversion.  (e.g., if the input value cannot fit in
 * the destination type).  However they allow loss of precision (e.g.,
 * converting nanoseconds to a struct timeval which only has microsecond
 * granularity, or a struct timespec to std::chrono::minutes).
 */

#pragma once

#include <chrono>
#include <type_traits>

#include <folly/Conv.h>
#include <folly/Expected.h>
#include <folly/portability/SysTime.h>
#include <folly/portability/SysTypes.h>

namespace folly {
namespace detail {

template <typename T>
struct is_duration : std::false_type {};
template <typename Rep, typename Period>
struct is_duration<std::chrono::duration<Rep, Period>> : std::true_type {};
template <typename T>
struct is_time_point : std::false_type {};
template <typename Clock, typename Duration>
struct is_time_point<std::chrono::time_point<Clock, Duration>>
    : std::true_type {};
template <typename T>
struct is_std_chrono_type {
  static constexpr bool value =
      is_duration<T>::value || is_time_point<T>::value;
};
template <typename T>
struct is_posix_time_type {
  static constexpr bool value = std::is_same<T, struct timespec>::value ||
      std::is_same<T, struct timeval>::value;
};
template <typename Tgt, typename Src>
struct is_chrono_conversion {
  static constexpr bool value =
      ((is_std_chrono_type<Tgt>::value && is_posix_time_type<Src>::value) ||
       (is_posix_time_type<Tgt>::value && is_std_chrono_type<Src>::value));
};

/**
 * This converts a number in some input type to time_t while ensuring that it
 * fits in the range of numbers representable by time_t.
 *
 * This is similar to the normal folly::tryTo() behavior when converting
 * arthmetic types to an integer type, except that it does not complain about
 * floating point conversions losing precision.
 */
template <typename Src>
Expected<time_t, ConversionCode> chronoRangeCheck(Src value) {
  if (value > std::numeric_limits<time_t>::max()) {
    return makeUnexpected(ConversionCode::POSITIVE_OVERFLOW);
  }
  if (std::is_signed<Src>::value) {
    if (value < std::numeric_limits<time_t>::lowest()) {
      return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
    }
  }

  return static_cast<time_t>(value);
}

/**
 * Convert a std::chrono::duration with second granularity to a pair of
 * (seconds, subseconds)
 *
 * The SubsecondRatio template parameter specifies what type of subseconds to
 * return.  This must have a numerator of 1.
 */
template <typename SubsecondRatio, typename Rep>
static Expected<std::pair<time_t, long>, ConversionCode> durationToPosixTime(
    const std::chrono::duration<Rep, std::ratio<1, 1>>& duration) {
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  auto sec = chronoRangeCheck(duration.count());
  if (sec.hasError()) {
    return makeUnexpected(sec.error());
  }

  time_t secValue = sec.value();
  long subsec = 0L;
  if (std::is_floating_point<Rep>::value) {
    auto fraction = (duration.count() - secValue);
    subsec = static_cast<long>(fraction * SubsecondRatio::den);
    if (duration.count() < 0 && fraction < 0) {
      if (secValue == std::numeric_limits<time_t>::lowest()) {
        return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
      }
      secValue -= 1;
      subsec += SubsecondRatio::den;
    }
  }
  return std::pair<time_t, long>{secValue, subsec};
}

/**
 * Convert a std::chrono::duration with subsecond granularity to a pair of
 * (seconds, subseconds)
 */
template <typename SubsecondRatio, typename Rep, std::intmax_t Denominator>
static Expected<std::pair<time_t, long>, ConversionCode> durationToPosixTime(
    const std::chrono::duration<Rep, std::ratio<1, Denominator>>& duration) {
  static_assert(Denominator != 1, "special case expecting den != 1");
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  auto sec = chronoRangeCheck(duration.count() / Denominator);
  if (sec.hasError()) {
    return makeUnexpected(sec.error());
  }
  auto secTimeT = sec.value();

  auto remainder = duration.count() - (secTimeT * Denominator);
  auto subsec = (remainder * SubsecondRatio::den) / Denominator;
  if (UNLIKELY(duration.count() < 0) && remainder != 0) {
    if (secTimeT == std::numeric_limits<time_t>::lowest()) {
      return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
    }
    secTimeT -= 1;
    subsec += SubsecondRatio::den;
  }

  return std::pair<time_t, long>{secTimeT, subsec};
}

/**
 * Convert a std::chrono::duration with coarser-than-second granularity to a
 * pair of (seconds, subseconds)
 */
template <typename SubsecondRatio, typename Rep, std::intmax_t Numerator>
static Expected<std::pair<time_t, long>, ConversionCode> durationToPosixTime(
    const std::chrono::duration<Rep, std::ratio<Numerator, 1>>& duration) {
  static_assert(Numerator != 1, "special case expecting num!=1");
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  constexpr auto maxValue = std::numeric_limits<time_t>::max() / Numerator;
  constexpr auto minValue = std::numeric_limits<time_t>::lowest() / Numerator;
  if (duration.count() > maxValue) {
    return makeUnexpected(ConversionCode::POSITIVE_OVERFLOW);
  }
  if (duration.count() < minValue) {
    return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
  }

  // Note that we can't use chronoRangeCheck() here since we have to check
  // if (duration.count() * Numerator) would overflow (which we do above).
  auto secOriginalRep = (duration.count() * Numerator);
  auto sec = static_cast<time_t>(secOriginalRep);

  long subsec = 0L;
  if (std::is_floating_point<Rep>::value) {
    auto fraction = secOriginalRep - sec;
    subsec = static_cast<long>(fraction * SubsecondRatio::den);
    if (duration.count() < 0 && fraction < 0) {
      if (sec == std::numeric_limits<time_t>::lowest()) {
        return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
      }
      sec -= 1;
      subsec += SubsecondRatio::den;
    }
  }
  return std::pair<time_t, long>{sec, subsec};
}

/*
 * Helper classes for picking an intermediate duration type to use
 * when doing conversions to/from durations where neither the numerator nor
 * denominator are 1.
 */
template <typename T, bool IsFloatingPoint, bool IsSigned>
struct IntermediateTimeRep {};
template <typename T, bool IsSigned>
struct IntermediateTimeRep<T, true, IsSigned> {
  using type = T;
};
template <typename T>
struct IntermediateTimeRep<T, false, true> {
  using type = intmax_t;
};
template <typename T>
struct IntermediateTimeRep<T, false, false> {
  using type = uintmax_t;
};
// For IntermediateDuration we always use 1 as the numerator, and the original
// Period denominator.  This ensures that we do not lose precision when
// performing the conversion.
template <typename Rep, typename Period>
using IntermediateDuration = std::chrono::duration<
    typename IntermediateTimeRep<
        Rep,
        std::is_floating_point<Rep>::value,
        std::is_signed<Rep>::value>::type,
    std::ratio<1, Period::den>>;

/**
 * Convert a std::chrono::duration to a pair of (seconds, subseconds)
 *
 * This overload is only used for unusual durations where neither the numerator
 * nor denominator are 1.
 */
template <typename SubsecondRatio, typename Rep, typename Period>
Expected<std::pair<time_t, long>, ConversionCode> durationToPosixTime(
    const std::chrono::duration<Rep, Period>& duration) {
  static_assert(Period::num != 1, "should use special-case code when num==1");
  static_assert(Period::den != 1, "should use special-case code when den==1");
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  // Perform this conversion by first converting to a duration where the
  // numerator is 1, then convert to the output type.
  using IntermediateType = IntermediateDuration<Rep, Period>;
  using IntermediateRep = typename IntermediateType::rep;

  // Check to see if we would have overflow converting to the intermediate
  // type.
  constexpr auto maxInput =
      std::numeric_limits<IntermediateRep>::max() / Period::num;
  if (duration.count() > maxInput) {
    return makeUnexpected(ConversionCode::POSITIVE_OVERFLOW);
  }
  constexpr auto minInput =
      std::numeric_limits<IntermediateRep>::min() / Period::num;
  if (duration.count() < minInput) {
    return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
  }
  auto intermediate =
      IntermediateType{static_cast<IntermediateRep>(duration.count()) *
                       static_cast<IntermediateRep>(Period::num)};

  return durationToPosixTime<SubsecondRatio>(intermediate);
}

/**
 * Check for overflow when converting to a duration type that is second
 * granularity or finer (e.g., nanoseconds, milliseconds, seconds)
 *
 * This assumes the input is normalized, with subseconds >= 0 and subseconds
 * less than 1 second.
 */
template <bool IsFloatingPoint>
struct CheckOverflowToDuration {
  template <
      typename Tgt,
      typename SubsecondRatio,
      typename Seconds,
      typename Subseconds>
  static ConversionCode check(Seconds seconds, Subseconds subseconds) {
    static_assert(
        Tgt::period::num == 1,
        "this implementation should only be used for subsecond granularity "
        "duration types");
    static_assert(
        !std::is_floating_point<typename Tgt::rep>::value, "incorrect usage");
    static_assert(
        SubsecondRatio::num == 1, "subsecond numerator should always be 1");

    if (LIKELY(seconds >= 0)) {
      constexpr auto maxCount = std::numeric_limits<typename Tgt::rep>::max();
      constexpr auto maxSeconds = maxCount / Tgt::period::den;

      auto unsignedSeconds = to_unsigned(seconds);
      if (LIKELY(unsignedSeconds < maxSeconds)) {
        return ConversionCode::SUCCESS;
      }

      if (UNLIKELY(unsignedSeconds == maxSeconds)) {
        constexpr auto maxRemainder =
            maxCount - (maxSeconds * Tgt::period::den);
        constexpr auto maxSubseconds =
            (maxRemainder * SubsecondRatio::den) / Tgt::period::den;
        if (subseconds <= 0) {
          return ConversionCode::SUCCESS;
        }
        if (to_unsigned(subseconds) <= maxSubseconds) {
          return ConversionCode::SUCCESS;
        }
      }
      return ConversionCode::POSITIVE_OVERFLOW;
    } else if (std::is_unsigned<typename Tgt::rep>::value) {
      return ConversionCode::NEGATIVE_OVERFLOW;
    } else {
      constexpr auto minCount =
          to_signed(std::numeric_limits<typename Tgt::rep>::lowest());
      constexpr auto minSeconds = (minCount / Tgt::period::den);
      if (LIKELY(seconds >= minSeconds)) {
        return ConversionCode::SUCCESS;
      }

      if (UNLIKELY(seconds == minSeconds - 1)) {
        constexpr auto maxRemainder =
            minCount - (minSeconds * Tgt::period::den) + Tgt::period::den;
        constexpr auto maxSubseconds =
            (maxRemainder * SubsecondRatio::den) / Tgt::period::den;
        if (subseconds <= 0) {
          return ConversionCode::NEGATIVE_OVERFLOW;
        }
        if (subseconds >= maxSubseconds) {
          return ConversionCode::SUCCESS;
        }
      }
      return ConversionCode::NEGATIVE_OVERFLOW;
    }
  }
};

template <>
struct CheckOverflowToDuration<true> {
  template <
      typename Tgt,
      typename SubsecondRatio,
      typename Seconds,
      typename Subseconds>
  static ConversionCode check(
      Seconds /* seconds */,
      Subseconds /* subseconds */) {
    static_assert(
        std::is_floating_point<typename Tgt::rep>::value, "incorrect usage");
    static_assert(
        SubsecondRatio::num == 1, "subsecond numerator should always be 1");

    // We expect floating point types to have much a wider representable range
    // than integer types, so we don't bother actually checking the input
    // integer value here.
    static_assert(
        std::numeric_limits<typename Tgt::rep>::max() >=
            std::numeric_limits<Seconds>::max(),
        "unusually limited floating point type");
    static_assert(
        std::numeric_limits<typename Tgt::rep>::lowest() <=
            std::numeric_limits<Seconds>::lowest(),
        "unusually limited floating point type");

    return ConversionCode::SUCCESS;
  }
};

/**
 * Convert a timeval or a timespec to a std::chrono::duration with second
 * granularity.
 *
 * The SubsecondRatio template parameter specifies what type of subseconds to
 * return.  This must have a numerator of 1.
 *
 * The input must be in normalized form: the subseconds field must be greater
 * than or equal to 0, and less than SubsecondRatio::den (i.e., less than 1
 * second).
 */
template <
    typename SubsecondRatio,
    typename Seconds,
    typename Subseconds,
    typename Rep>
auto posixTimeToDuration(
    Seconds seconds,
    Subseconds subseconds,
    std::chrono::duration<Rep, std::ratio<1, 1>> dummy)
    -> Expected<decltype(dummy), ConversionCode> {
  using Tgt = decltype(dummy);
  static_assert(Tgt::period::num == 1, "special case expecting num==1");
  static_assert(Tgt::period::den == 1, "special case expecting den==1");
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  auto outputSeconds = tryTo<typename Tgt::rep>(seconds);
  if (outputSeconds.hasError()) {
    return makeUnexpected(outputSeconds.error());
  }

  if (std::is_floating_point<typename Tgt::rep>::value) {
    return Tgt{typename Tgt::rep(seconds) +
               (typename Tgt::rep(subseconds) / SubsecondRatio::den)};
  }

  // If the value is negative, we have to round up a non-zero subseconds value
  if (UNLIKELY(outputSeconds.value() < 0) && subseconds > 0) {
    if (UNLIKELY(
            outputSeconds.value() ==
            std::numeric_limits<typename Tgt::rep>::lowest())) {
      return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
    }
    return Tgt{outputSeconds.value() + 1};
  }

  return Tgt{outputSeconds.value()};
}

/**
 * Convert a timeval or a timespec to a std::chrono::duration with subsecond
 * granularity
 */
template <
    typename SubsecondRatio,
    typename Seconds,
    typename Subseconds,
    typename Rep,
    std::intmax_t Denominator>
auto posixTimeToDuration(
    Seconds seconds,
    Subseconds subseconds,
    std::chrono::duration<Rep, std::ratio<1, Denominator>> dummy)
    -> Expected<decltype(dummy), ConversionCode> {
  using Tgt = decltype(dummy);
  static_assert(Tgt::period::num == 1, "special case expecting num==1");
  static_assert(Tgt::period::den != 1, "special case expecting den!=1");
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  auto errorCode = detail::CheckOverflowToDuration<
      std::is_floating_point<typename Tgt::rep>::value>::
      template check<Tgt, SubsecondRatio>(seconds, subseconds);
  if (errorCode != ConversionCode::SUCCESS) {
    return makeUnexpected(errorCode);
  }

  if (LIKELY(seconds >= 0)) {
    return std::chrono::duration_cast<Tgt>(
               std::chrono::duration<typename Tgt::rep>{seconds}) +
        std::chrono::duration_cast<Tgt>(
               std::chrono::duration<typename Tgt::rep, SubsecondRatio>{
                   subseconds});
  } else {
    // For negative numbers we have to round subseconds up towards zero, even
    // though it is a positive value, since the overall value is negative.
    return std::chrono::duration_cast<Tgt>(
               std::chrono::duration<typename Tgt::rep>{seconds + 1}) -
        std::chrono::duration_cast<Tgt>(
               std::chrono::duration<typename Tgt::rep, SubsecondRatio>{
                   SubsecondRatio::den - subseconds});
  }
}

/**
 * Convert a timeval or a timespec to a std::chrono::duration with
 * granularity coarser than 1 second.
 */
template <
    typename SubsecondRatio,
    typename Seconds,
    typename Subseconds,
    typename Rep,
    std::intmax_t Numerator>
auto posixTimeToDuration(
    Seconds seconds,
    Subseconds subseconds,
    std::chrono::duration<Rep, std::ratio<Numerator, 1>> dummy)
    -> Expected<decltype(dummy), ConversionCode> {
  using Tgt = decltype(dummy);
  static_assert(Tgt::period::num != 1, "special case expecting num!=1");
  static_assert(Tgt::period::den == 1, "special case expecting den==1");
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  if (UNLIKELY(seconds < 0) && subseconds > 0) {
    // Increment seconds by one to handle truncation of negative numbers
    // properly.
    if (UNLIKELY(seconds == std::numeric_limits<Seconds>::lowest())) {
      return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
    }
    seconds += 1;
  }

  if (std::is_floating_point<typename Tgt::rep>::value) {
    // Convert to the floating point type before performing the division
    return Tgt{static_cast<typename Tgt::rep>(seconds) / Tgt::period::num};
  } else {
    // Perform the division as an integer, and check that the result fits in
    // the output integer type
    auto outputValue = (seconds / Tgt::period::num);
    auto expectedOuput = tryTo<typename Tgt::rep>(outputValue);
    if (expectedOuput.hasError()) {
      return makeUnexpected(expectedOuput.error());
    }

    return Tgt{expectedOuput.value()};
  }
}

/**
 * Convert a timeval or timespec to a std::chrono::duration
 *
 * This overload is only used for unusual durations where neither the numerator
 * nor denominator are 1.
 */
template <
    typename SubsecondRatio,
    typename Seconds,
    typename Subseconds,
    typename Rep,
    std::intmax_t Denominator,
    std::intmax_t Numerator>
auto posixTimeToDuration(
    Seconds seconds,
    Subseconds subseconds,
    std::chrono::duration<Rep, std::ratio<Numerator, Denominator>> dummy)
    -> Expected<decltype(dummy), ConversionCode> {
  using Tgt = decltype(dummy);
  static_assert(
      Tgt::period::num != 1, "should use special-case code when num==1");
  static_assert(
      Tgt::period::den != 1, "should use special-case code when den==1");
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  // Cast through an intermediate type with subsecond granularity.
  // Note that this could fail due to overflow during the initial conversion
  // even if the result is representable in the output POSIX-style types.
  //
  // Note that for integer type conversions going through this intermediate
  // type can result in slight imprecision due to truncating the intermediate
  // calculation to an integer.
  using IntermediateType =
      IntermediateDuration<typename Tgt::rep, typename Tgt::period>;
  auto intermediate = posixTimeToDuration<SubsecondRatio>(
      seconds, subseconds, IntermediateType{});
  if (intermediate.hasError()) {
    return makeUnexpected(intermediate.error());
  }
  // Now convert back to the target duration.  Use tryTo() to confirm that the
  // result fits in the target representation type.
  return tryTo<typename Tgt::rep>(
             intermediate.value().count() / Tgt::period::num)
      .then([](typename Tgt::rep tgt) { return Tgt{tgt}; });
}

template <
    typename Tgt,
    typename SubsecondRatio,
    typename Seconds,
    typename Subseconds>
Expected<Tgt, ConversionCode> tryPosixTimeToDuration(
    Seconds seconds,
    Subseconds subseconds) {
  static_assert(
      SubsecondRatio::num == 1, "subsecond numerator should always be 1");

  // Normalize the input if required
  if (UNLIKELY(subseconds < 0)) {
    const auto overflowSeconds = (subseconds / SubsecondRatio::den);
    const auto remainder = (subseconds % SubsecondRatio::den);
    if (std::numeric_limits<Seconds>::lowest() + 1 - overflowSeconds >
        seconds) {
      return makeUnexpected(ConversionCode::NEGATIVE_OVERFLOW);
    }
    seconds = seconds - 1 + overflowSeconds;
    subseconds = remainder + SubsecondRatio::den;
  } else if (UNLIKELY(subseconds >= SubsecondRatio::den)) {
    const auto overflowSeconds = (subseconds / SubsecondRatio::den);
    const auto remainder = (subseconds % SubsecondRatio::den);
    if (std::numeric_limits<Seconds>::max() - overflowSeconds < seconds) {
      return makeUnexpected(ConversionCode::POSITIVE_OVERFLOW);
    }
    seconds += overflowSeconds;
    subseconds = remainder;
  }

  return posixTimeToDuration<SubsecondRatio>(seconds, subseconds, Tgt{});
}

} // namespace detail

/**
 * struct timespec to std::chrono::duration
 */
template <typename Tgt>
typename std::enable_if<
    detail::is_duration<Tgt>::value,
    Expected<Tgt, ConversionCode>>::type
tryTo(const struct timespec& ts) {
  return detail::tryPosixTimeToDuration<Tgt, std::nano>(ts.tv_sec, ts.tv_nsec);
}

/**
 * struct timeval to std::chrono::duration
 */
template <typename Tgt>
typename std::enable_if<
    detail::is_duration<Tgt>::value,
    Expected<Tgt, ConversionCode>>::type
tryTo(const struct timeval& tv) {
  return detail::tryPosixTimeToDuration<Tgt, std::micro>(tv.tv_sec, tv.tv_usec);
}

/**
 * timespec or timeval to std::chrono::time_point
 */
template <typename Tgt, typename Src>
typename std::enable_if<
    detail::is_time_point<Tgt>::value && detail::is_posix_time_type<Src>::value,
    Expected<Tgt, ConversionCode>>::type
tryTo(const Src& value) {
  return tryTo<typename Tgt::duration>(value).then(
      [](typename Tgt::duration result) { return Tgt(result); });
}

/**
 * std::chrono::duration to struct timespec
 */
template <typename Tgt, typename Rep, typename Period>
typename std::enable_if<
    std::is_same<Tgt, struct timespec>::value,
    Expected<Tgt, ConversionCode>>::type
tryTo(const std::chrono::duration<Rep, Period>& duration) {
  auto result = detail::durationToPosixTime<std::nano>(duration);
  if (result.hasError()) {
    return makeUnexpected(result.error());
  }

  struct timespec ts;
  ts.tv_sec = result.value().first;
  ts.tv_nsec = result.value().second;
  return ts;
}

/**
 * std::chrono::duration to struct timeval
 */
template <typename Tgt, typename Rep, typename Period>
typename std::enable_if<
    std::is_same<Tgt, struct timeval>::value,
    Expected<Tgt, ConversionCode>>::type
tryTo(const std::chrono::duration<Rep, Period>& duration) {
  auto result = detail::durationToPosixTime<std::micro>(duration);
  if (result.hasError()) {
    return makeUnexpected(result.error());
  }

  struct timeval tv;
  tv.tv_sec = result.value().first;
  tv.tv_usec = result.value().second;
  return tv;
}

/**
 * std::chrono::time_point to timespec or timeval
 */
template <typename Tgt, typename Clock, typename Duration>
typename std::enable_if<
    detail::is_posix_time_type<Tgt>::value,
    Expected<Tgt, ConversionCode>>::type
tryTo(const std::chrono::time_point<Clock, Duration>& timePoint) {
  return tryTo<Tgt>(timePoint.time_since_epoch());
}

/**
 * For all chrono conversions, to() wraps tryTo()
 */
template <typename Tgt, typename Src>
typename std::enable_if<detail::is_chrono_conversion<Tgt, Src>::value, Tgt>::
    type
    to(const Src& value) {
  return tryTo<Tgt>(value).thenOrThrow(
      [](Tgt res) { return res; },
      [&](ConversionCode e) { return makeConversionError(e, StringPiece{}); });
}

} // namespace folly
