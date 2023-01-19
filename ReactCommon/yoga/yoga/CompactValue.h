/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#if defined(__has_include) && __has_include(<version>)
// needed to be able to evaluate defined(__cpp_lib_bit_cast)
#include <version>
#else
// needed to be able to evaluate defined(__cpp_lib_bit_cast)
#include <ciso646>
#endif

#ifdef __cpp_lib_bit_cast
#include <bit>
#else
#include <cstring>
#endif
#include "YGValue.h"
#include "YGMacros.h"
#include <cmath>
#include <cstdint>
#include <limits>

static_assert(
    std::numeric_limits<float>::is_iec559,
    "facebook::yoga::detail::CompactValue only works with IEEE754 floats");

#ifdef YOGA_COMPACT_VALUE_TEST
#define VISIBLE_FOR_TESTING public:
#else
#define VISIBLE_FOR_TESTING private:
#endif

namespace facebook {
namespace yoga {
namespace detail {

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
class YOGA_EXPORT CompactValue {
  friend constexpr bool operator==(CompactValue, CompactValue) noexcept;

public:
  static constexpr auto LOWER_BOUND = 1.08420217e-19f;
  static constexpr auto UPPER_BOUND_POINT = 36893485948395847680.0f;
  static constexpr auto UPPER_BOUND_PERCENT = 18446742974197923840.0f;

  template <YGUnit Unit>
  static CompactValue of(float value) noexcept {
    if (value == 0.0f || (value < LOWER_BOUND && value > -LOWER_BOUND)) {
      constexpr auto zero =
          Unit == YGUnitPercent ? ZERO_BITS_PERCENT : ZERO_BITS_POINT;
      return {zero};
    }

    constexpr auto upperBound =
        Unit == YGUnitPercent ? UPPER_BOUND_PERCENT : UPPER_BOUND_POINT;
    if (value > upperBound || value < -upperBound) {
      value = copysignf(upperBound, value);
    }

    uint32_t unitBit = Unit == YGUnitPercent ? PERCENT_BIT : 0;
    auto data = asU32(value);
    data -= BIAS;
    data |= unitBit;
    return {data};
  }

  template <YGUnit Unit>
  static CompactValue ofMaybe(float value) noexcept {
    return std::isnan(value) || std::isinf(value) ? ofUndefined()
                                                  : of<Unit>(value);
  }

  static constexpr CompactValue ofZero() noexcept {
    return CompactValue{ZERO_BITS_POINT};
  }

  static constexpr CompactValue ofUndefined() noexcept {
    return CompactValue{};
  }

  static constexpr CompactValue ofAuto() noexcept {
    return CompactValue{AUTO_BITS};
  }

  constexpr CompactValue() noexcept : repr_(0x7FC00000) {}

  CompactValue(const YGValue& x) noexcept : repr_(uint32_t{0}) {
    switch (x.unit) {
      case YGUnitUndefined:
        *this = ofUndefined();
        break;
      case YGUnitAuto:
        *this = ofAuto();
        break;
      case YGUnitPoint:
        *this = of<YGUnitPoint>(x.value);
        break;
      case YGUnitPercent:
        *this = of<YGUnitPercent>(x.value);
        break;
    }
  }

  operator YGValue() const noexcept {
    switch (repr_) {
      case AUTO_BITS:
        return YGValueAuto;
      case ZERO_BITS_POINT:
        return YGValue{0.0f, YGUnitPoint};
      case ZERO_BITS_PERCENT:
        return YGValue{0.0f, YGUnitPercent};
    }

    if (std::isnan(asFloat(repr_))) {
      return YGValueUndefined;
    }

    auto data = repr_;
    data &= ~PERCENT_BIT;
    data += BIAS;

    return YGValue{
        asFloat(data), repr_ & 0x40000000 ? YGUnitPercent : YGUnitPoint};
  }

  bool isUndefined() const noexcept {
    return (
        repr_ != AUTO_BITS && repr_ != ZERO_BITS_POINT &&
        repr_ != ZERO_BITS_PERCENT && std::isnan(asFloat(repr_)));
  }

  bool isAuto() const noexcept { return repr_ == AUTO_BITS; }

private:
  uint32_t repr_;

  static constexpr uint32_t BIAS = 0x20000000;
  static constexpr uint32_t PERCENT_BIT = 0x40000000;

  // these are signaling NaNs with specific bit pattern as payload they will be
  // silenced whenever going through an FPU operation on ARM + x86
  static constexpr uint32_t AUTO_BITS = 0x7faaaaaa;
  static constexpr uint32_t ZERO_BITS_POINT = 0x7f8f0f0f;
  static constexpr uint32_t ZERO_BITS_PERCENT = 0x7f80f0f0;

  constexpr CompactValue(uint32_t data) noexcept : repr_(data) {}

  VISIBLE_FOR_TESTING uint32_t repr() { return repr_; }

  static uint32_t asU32(float f) {
#ifdef __cpp_lib_bit_cast
    return std::bit_cast<uint32_t>(f);
#else
    uint32_t u;
    static_assert(
        sizeof(u) == sizeof(f), "uint32_t and float must have the same size");
    std::memcpy(&u, &f, sizeof(f));
    return u;
#endif
  }

  static float asFloat(uint32_t u) {
#ifdef __cpp_lib_bit_cast
    return std::bit_cast<float>(u);
#else
    float f;
    static_assert(
        sizeof(f) == sizeof(u), "uint32_t and float must have the same size");
    std::memcpy(&f, &u, sizeof(u));
    return f;
#endif
  }
};

template <>
CompactValue CompactValue::of<YGUnitUndefined>(float) noexcept = delete;
template <>
CompactValue CompactValue::of<YGUnitAuto>(float) noexcept = delete;
template <>
CompactValue CompactValue::ofMaybe<YGUnitUndefined>(float) noexcept = delete;
template <>
CompactValue CompactValue::ofMaybe<YGUnitAuto>(float) noexcept = delete;

constexpr bool operator==(CompactValue a, CompactValue b) noexcept {
  return a.repr_ == b.repr_;
}

constexpr bool operator!=(CompactValue a, CompactValue b) noexcept {
  return !(a == b);
}

} // namespace detail
} // namespace yoga
} // namespace facebook

#endif
