/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

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
      return {Payload{zero}};
    }

    constexpr auto upperBound =
        Unit == YGUnitPercent ? UPPER_BOUND_PERCENT : UPPER_BOUND_POINT;
    if (value > upperBound || value < -upperBound) {
      value = copysignf(upperBound, value);
    }

    uint32_t unitBit = Unit == YGUnitPercent ? PERCENT_BIT : 0;
    auto data = Payload{value};
    data.repr -= BIAS;
    data.repr |= unitBit;
    return {data};
  }

  template <YGUnit Unit>
  static CompactValue ofMaybe(float value) noexcept {
    return std::isnan(value) || std::isinf(value) ? ofUndefined()
                                                  : of<Unit>(value);
  }

  static constexpr CompactValue ofZero() noexcept {
    return CompactValue{Payload{ZERO_BITS_POINT}};
  }

  static constexpr CompactValue ofUndefined() noexcept {
    return CompactValue{};
  }

  static constexpr CompactValue ofAuto() noexcept {
    return CompactValue{Payload{AUTO_BITS}};
  }

  constexpr CompactValue() noexcept
      : payload_(std::numeric_limits<float>::quiet_NaN()) {}

  CompactValue(const YGValue& x) noexcept : payload_(uint32_t{0}) {
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
    switch (payload_.repr) {
      case AUTO_BITS:
        return YGValueAuto;
      case ZERO_BITS_POINT:
        return YGValue{0.0f, YGUnitPoint};
      case ZERO_BITS_PERCENT:
        return YGValue{0.0f, YGUnitPercent};
    }

    if (std::isnan(payload_.value)) {
      return YGValueUndefined;
    }

    auto data = payload_;
    data.repr &= ~PERCENT_BIT;
    data.repr += BIAS;

    return YGValue{
        data.value, payload_.repr & 0x40000000 ? YGUnitPercent : YGUnitPoint};
  }

  bool isUndefined() const noexcept {
    return (
        payload_.repr != AUTO_BITS && payload_.repr != ZERO_BITS_POINT &&
        payload_.repr != ZERO_BITS_PERCENT && std::isnan(payload_.value));
  }

  bool isAuto() const noexcept { return payload_.repr == AUTO_BITS; }

private:
  union Payload {
    float value;
    uint32_t repr;
    Payload() = delete;
    constexpr Payload(uint32_t r) : repr(r) {}
    constexpr Payload(float v) : value(v) {}
  };

  static constexpr uint32_t BIAS = 0x20000000;
  static constexpr uint32_t PERCENT_BIT = 0x40000000;

  // these are signaling NaNs with specific bit pattern as payload they will be
  // silenced whenever going through an FPU operation on ARM + x86
  static constexpr uint32_t AUTO_BITS = 0x7faaaaaa;
  static constexpr uint32_t ZERO_BITS_POINT = 0x7f8f0f0f;
  static constexpr uint32_t ZERO_BITS_PERCENT = 0x7f80f0f0;

  constexpr CompactValue(Payload data) noexcept : payload_(data) {}

  Payload payload_;

  VISIBLE_FOR_TESTING uint32_t repr() { return payload_.repr; }
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
  return a.payload_.repr == b.payload_.repr;
}

constexpr bool operator!=(CompactValue a, CompactValue b) noexcept {
  return !(a == b);
}

} // namespace detail
} // namespace yoga
} // namespace facebook
