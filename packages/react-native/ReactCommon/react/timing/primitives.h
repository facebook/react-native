/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>

namespace facebook::react {

class HighResDuration;
class HighResTimeStamp;

/*
 * A class representing a duration of time with high precision.
 *
 * @see __docs__/README.md for more information.
 */
class HighResDuration {
  friend class HighResTimeStamp;
  friend constexpr HighResDuration operator-(
      const HighResTimeStamp& lhs,
      const HighResTimeStamp& rhs);
  friend constexpr HighResTimeStamp operator+(
      const HighResTimeStamp& lhs,
      const HighResDuration& rhs);
  friend constexpr HighResTimeStamp operator-(
      const HighResTimeStamp& lhs,
      const HighResDuration& rhs);

 public:
  constexpr HighResDuration()
      : chronoDuration_(std::chrono::steady_clock::duration()) {}

  static constexpr HighResDuration zero() {
    return HighResDuration(std::chrono::steady_clock::duration::zero());
  }

  static constexpr HighResDuration fromChrono(
      std::chrono::steady_clock::duration chronoDuration) {
    return HighResDuration(chronoDuration);
  }

  static constexpr HighResDuration fromNanoseconds(int64_t units) {
    return HighResDuration(std::chrono::nanoseconds(units));
  }

  static constexpr HighResDuration fromMilliseconds(int64_t units) {
    return HighResDuration(std::chrono::milliseconds(units));
  }

  constexpr int64_t toNanoseconds() const {
    return std::chrono::duration_cast<std::chrono::nanoseconds>(chronoDuration_)
        .count();
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp
  static constexpr HighResDuration fromDOMHighResTimeStamp(double units) {
    auto nanoseconds = static_cast<int64_t>(units * 1e6);
    return fromNanoseconds(nanoseconds);
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp
  constexpr double toDOMHighResTimeStamp() const {
    return static_cast<std::chrono::duration<double, std::milli>>(
               chronoDuration_)
        .count();
  }

  constexpr HighResDuration operator+(const HighResDuration& rhs) const {
    return HighResDuration(chronoDuration_ + rhs.chronoDuration_);
  }

  constexpr HighResDuration operator+(
      const std::chrono::steady_clock::duration& rhs) const {
    return HighResDuration(chronoDuration_ + rhs);
  }

  constexpr HighResDuration operator-(const HighResDuration& rhs) const {
    return HighResDuration(chronoDuration_ - rhs.chronoDuration_);
  }

  constexpr HighResDuration operator-(
      const std::chrono::steady_clock::duration& rhs) const {
    return HighResDuration(chronoDuration_ - rhs);
  }

  constexpr HighResDuration& operator+=(const HighResDuration& rhs) {
    chronoDuration_ += rhs.chronoDuration_;
    return *this;
  }

  constexpr HighResDuration& operator+=(
      const std::chrono::steady_clock::duration& rhs) {
    chronoDuration_ += rhs;
    return *this;
  }

  constexpr HighResDuration& operator-=(const HighResDuration& rhs) {
    chronoDuration_ -= rhs.chronoDuration_;
    return *this;
  }

  constexpr HighResDuration& operator-=(
      const std::chrono::steady_clock::duration& rhs) {
    chronoDuration_ -= rhs;
    return *this;
  }

  constexpr bool operator==(const HighResDuration& rhs) const {
    return chronoDuration_ == rhs.chronoDuration_;
  }

  constexpr bool operator==(
      const std::chrono::steady_clock::duration& rhs) const {
    return chronoDuration_ == rhs;
  }

  constexpr bool operator!=(const HighResDuration& rhs) const {
    return chronoDuration_ != rhs.chronoDuration_;
  }

  constexpr bool operator!=(
      const std::chrono::steady_clock::duration& rhs) const {
    return chronoDuration_ != rhs;
  }

  constexpr bool operator<(const HighResDuration& rhs) const {
    return chronoDuration_ < rhs.chronoDuration_;
  }

  constexpr bool operator<(
      const std::chrono::steady_clock::duration& rhs) const {
    return chronoDuration_ < rhs;
  }

  constexpr bool operator<=(const HighResDuration& rhs) const {
    return chronoDuration_ <= rhs.chronoDuration_;
  }

  constexpr bool operator<=(
      const std::chrono::steady_clock::duration& rhs) const {
    return chronoDuration_ <= rhs;
  }

  constexpr bool operator>(const HighResDuration& rhs) const {
    return chronoDuration_ > rhs.chronoDuration_;
  }

  constexpr bool operator>(
      const std::chrono::steady_clock::duration& rhs) const {
    return chronoDuration_ > rhs;
  }

  constexpr bool operator>=(const HighResDuration& rhs) const {
    return chronoDuration_ >= rhs.chronoDuration_;
  }

  constexpr bool operator>=(
      const std::chrono::steady_clock::duration& rhs) const {
    return chronoDuration_ >= rhs;
  }

  constexpr operator std::chrono::steady_clock::duration() const {
    return chronoDuration_;
  }

 private:
  explicit constexpr HighResDuration(
      std::chrono::steady_clock::duration chronoDuration)
      : chronoDuration_(chronoDuration) {}

  std::chrono::steady_clock::duration chronoDuration_;
};

/*
 * A class representing a specific point in time with high precision.
 *
 * @see __docs__/README.md for more information.
 */
class HighResTimeStamp {
  friend constexpr HighResDuration operator-(
      const HighResTimeStamp& lhs,
      const HighResTimeStamp& rhs);
  friend constexpr HighResTimeStamp operator+(
      const HighResTimeStamp& lhs,
      const HighResDuration& rhs);
  friend constexpr HighResTimeStamp operator-(
      const HighResTimeStamp& lhs,
      const HighResDuration& rhs);

 public:
  HighResTimeStamp() noexcept
      : chronoTimePoint_(std::chrono::steady_clock::now()) {}

  static constexpr HighResTimeStamp now() noexcept {
    return HighResTimeStamp(std::chrono::steady_clock::now());
  }

  static constexpr HighResTimeStamp min() noexcept {
    return HighResTimeStamp(std::chrono::steady_clock::time_point::min());
  }

  static constexpr HighResTimeStamp max() noexcept {
    return HighResTimeStamp(std::chrono::steady_clock::time_point::max());
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp
  static constexpr HighResTimeStamp fromDOMHighResTimeStamp(double units) {
    auto nanoseconds = static_cast<int64_t>(units * 1e6);
    return HighResTimeStamp(std::chrono::steady_clock::time_point(
        std::chrono::nanoseconds(nanoseconds)));
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp
  constexpr double toDOMHighResTimeStamp() const {
    return HighResDuration(chronoTimePoint_.time_since_epoch())
        .toDOMHighResTimeStamp();
  }

  // This method is expected to be used only when converting time stamps from
  // external systems.
  static constexpr HighResTimeStamp fromChronoSteadyClockTimePoint(
      std::chrono::steady_clock::time_point chronoTimePoint) {
    return HighResTimeStamp(chronoTimePoint);
  }

  // This method is provided for convenience, if you need to convert
  // HighResTimeStamp to some common epoch with time stamps from other sources.
  constexpr std::chrono::steady_clock::time_point toChronoSteadyClockTimePoint()
      const {
    return chronoTimePoint_;
  }

  constexpr bool operator==(const HighResTimeStamp& rhs) const {
    return chronoTimePoint_ == rhs.chronoTimePoint_;
  }

  constexpr bool operator!=(const HighResTimeStamp& rhs) const {
    return chronoTimePoint_ != rhs.chronoTimePoint_;
  }

  constexpr bool operator<(const HighResTimeStamp& rhs) const {
    return chronoTimePoint_ < rhs.chronoTimePoint_;
  }

  constexpr bool operator<=(const HighResTimeStamp& rhs) const {
    return chronoTimePoint_ <= rhs.chronoTimePoint_;
  }

  constexpr bool operator>(const HighResTimeStamp& rhs) const {
    return chronoTimePoint_ > rhs.chronoTimePoint_;
  }

  constexpr bool operator>=(const HighResTimeStamp& rhs) const {
    return chronoTimePoint_ >= rhs.chronoTimePoint_;
  }

  constexpr HighResTimeStamp& operator+=(const HighResDuration& rhs) {
    chronoTimePoint_ += rhs.chronoDuration_;
    return *this;
  }

  constexpr HighResTimeStamp& operator-=(const HighResDuration& rhs) {
    chronoTimePoint_ -= rhs.chronoDuration_;
    return *this;
  }

 private:
  explicit constexpr HighResTimeStamp(
      std::chrono::steady_clock::time_point chronoTimePoint)
      : chronoTimePoint_(chronoTimePoint) {}

  std::chrono::steady_clock::time_point chronoTimePoint_;
};

inline constexpr HighResDuration operator-(
    const HighResTimeStamp& lhs,
    const HighResTimeStamp& rhs) {
  return HighResDuration(lhs.chronoTimePoint_ - rhs.chronoTimePoint_);
}

inline constexpr HighResTimeStamp operator+(
    const HighResTimeStamp& lhs,
    const HighResDuration& rhs) {
  return HighResTimeStamp(lhs.chronoTimePoint_ + rhs.chronoDuration_);
}

inline constexpr HighResTimeStamp operator-(
    const HighResTimeStamp& lhs,
    const HighResDuration& rhs) {
  return HighResTimeStamp(lhs.chronoTimePoint_ - rhs.chronoDuration_);
}

} // namespace facebook::react
