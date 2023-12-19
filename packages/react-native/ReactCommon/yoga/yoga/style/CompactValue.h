/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <bit>
#include <cmath>
#include <cstdint>
#include <limits>

#include <yoga/YGMacros.h>
#include <yoga/YGValue.h>

#include <yoga/numeric/Comparison.h>
#include <yoga/style/StyleLength.h>

static_assert(
    std::numeric_limits<float>::is_iec559,
    "facebook::yoga::detail::CompactValue only works with IEEE754 floats");

#ifdef YOGA_COMPACT_VALUE_TEST
#define VISIBLE_FOR_TESTING public:
#else
#define VISIBLE_FOR_TESTING private:
#endif

namespace facebook::yoga {

// This class stores YGValue in 32 bits.
// - The value does not matter for Undefined and Auto. NaNs are used for their
//   representation.
// - To differentiate between Point and Percent, one exponent bit is used.
//   Supported the range [0x40, 0xbf] (0xbf is inclusive for point, but
//   exclusive for percent).
// - Value ranges:
//   points:  1.08420217e-19f to 36893485948395847680
//            0x00000000         0x3fffffff
//   percent: 1.08420217e-19f to 18446742974197923840
//            0x40000000         0x7f7fffff
// - Zero is supported, negative zero is not
// - values outside of the representable range are clamped
class CompactValue {
  friend constexpr bool operator==(CompactValue, CompactValue) noexcept;

 public:
  static constexpr auto LOWER_BOUND = 1.08420217e-19f;
  static constexpr auto UPPER_BOUND_POINT = 36893485948395847680.0f;
  static constexpr auto UPPER_BOUND_PERCENT = 18446742974197923840.0f;

  static constexpr CompactValue ofUndefined() noexcept {
    return CompactValue{};
  }

  static constexpr CompactValue ofAuto() noexcept {
    return CompactValue{AUTO_BITS};
  }

  constexpr CompactValue() noexcept = default;

  explicit constexpr CompactValue(const StyleLength& x) noexcept {
    switch (x.unit()) {
      case Unit::Undefined:
        *this = ofUndefined();
        break;
      case Unit::Auto:
        *this = ofAuto();
        break;
      case Unit::Point:
        *this = of<Unit::Point>(x.value().unwrap());
        break;
      case Unit::Percent:
        *this = of<Unit::Percent>(x.value().unwrap());
        break;
    }
  }

  explicit operator StyleLength() const noexcept {
    if (repr_ == 0x7FC00000) {
      return value::undefined();
    }

    switch (repr_) {
      case AUTO_BITS:
        return value::ofAuto();
      case ZERO_BITS_POINT:
        return value::points(0);
      case ZERO_BITS_PERCENT:
        return value::percent(0);
    }

    auto data = repr_;
    data &= ~PERCENT_BIT;
    data += BIAS;

    if (repr_ & 0x40000000) {
      return value::percent(std::bit_cast<float>(data));
    } else {
      return value::points(std::bit_cast<float>(data));
    }
  }

  bool isUndefined() const noexcept {
    return (
        repr_ != AUTO_BITS && repr_ != ZERO_BITS_POINT &&
        repr_ != ZERO_BITS_PERCENT && std::isnan(std::bit_cast<float>(repr_)));
  }

  bool isDefined() const noexcept {
    return !isUndefined();
  }

  bool isAuto() const noexcept {
    return repr_ == AUTO_BITS;
  }

 private:
  template <Unit UnitT>
  static CompactValue of(float value) noexcept {
    if (value == 0.0f || (value < LOWER_BOUND && value > -LOWER_BOUND)) {
      constexpr auto zero =
          UnitT == Unit::Percent ? ZERO_BITS_PERCENT : ZERO_BITS_POINT;
      return {zero};
    }

    constexpr auto upperBound =
        UnitT == Unit::Percent ? UPPER_BOUND_PERCENT : UPPER_BOUND_POINT;
    if (value > upperBound || value < -upperBound) {
      value = copysignf(upperBound, value);
    }

    uint32_t unitBit = UnitT == Unit::Percent ? PERCENT_BIT : 0;
    auto data = std::bit_cast<uint32_t>(value);
    data -= BIAS;
    data |= unitBit;
    return {data};
  }

  uint32_t repr_{0x7FC00000};

  static constexpr uint32_t BIAS = 0x20000000;
  static constexpr uint32_t PERCENT_BIT = 0x40000000;

  // these are signaling NaNs with specific bit pattern as payload they will be
  // silenced whenever going through an FPU operation on ARM + x86
  static constexpr uint32_t AUTO_BITS = 0x7faaaaaa;
  static constexpr uint32_t ZERO_BITS_POINT = 0x7f8f0f0f;
  static constexpr uint32_t ZERO_BITS_PERCENT = 0x7f80f0f0;

  constexpr CompactValue(uint32_t data) noexcept : repr_(data) {}

  VISIBLE_FOR_TESTING uint32_t repr() {
    return repr_;
  }
};

template <>
CompactValue CompactValue::of<Unit::Undefined>(float) noexcept = delete;
template <>
CompactValue CompactValue::of<Unit::Auto>(float) noexcept = delete;

constexpr bool operator==(CompactValue a, CompactValue b) noexcept {
  return a.repr_ == b.repr_;
}

constexpr bool operator!=(CompactValue a, CompactValue b) noexcept {
  return !(a == b);
}

inline bool inexactEquals(CompactValue a, CompactValue b) {
  return inexactEquals((StyleLength)a, (StyleLength)b);
}

} // namespace facebook::yoga
