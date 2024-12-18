/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/enums/Unit.h>
#include <yoga/numeric/FloatOptional.h>

namespace facebook::yoga {

/**
 * Style::Length represents a CSS Value which may be one of:
 * 1. Undefined
 * 2. A keyword (e.g. auto)
 * 3. A CSS <length-percentage> value:
 *    a. <length> value (e.g. 10px)
 *    b. <percentage> value of a reference <length>
 *
 * References:
 * 1. https://www.w3.org/TR/css-values-4/#lengths
 * 2. https://www.w3.org/TR/css-values-4/#percentage-value
 * 3. https://www.w3.org/TR/css-values-4/#mixed-percentages
 */
class StyleLength {
 public:
  constexpr StyleLength() = default;

  constexpr static StyleLength points(float value) {
    return yoga::isUndefined(value) || yoga::isinf(value)
        ? undefined()
        : StyleLength{FloatOptional{value}, Unit::Point};
  }

  constexpr static StyleLength percent(float value) {
    return yoga::isUndefined(value) || yoga::isinf(value)
        ? undefined()
        : StyleLength{FloatOptional{value}, Unit::Percent};
  }

  constexpr static StyleLength ofAuto() {
    return StyleLength{{}, Unit::Auto};
  }

  constexpr static StyleLength undefined() {
    return StyleLength{{}, Unit::Undefined};
  }

  constexpr bool isAuto() const {
    return unit_ == Unit::Auto;
  }

  constexpr bool isUndefined() const {
    return unit_ == Unit::Undefined;
  }

  constexpr bool isPoints() const {
    return unit_ == Unit::Point;
  }

  constexpr bool isPercent() const {
    return unit_ == Unit::Percent;
  }

  constexpr bool isDefined() const {
    return !isUndefined();
  }

  constexpr FloatOptional value() const {
    return value_;
  }

  constexpr FloatOptional resolve(float referenceLength) {
    switch (unit_) {
      case Unit::Point:
        return value_;
      case Unit::Percent:
        return FloatOptional{value_.unwrap() * referenceLength * 0.01f};
      default:
        return FloatOptional{};
    }
  }

  explicit constexpr operator YGValue() const {
    return YGValue{value_.unwrap(), unscopedEnum(unit_)};
  }

  constexpr bool operator==(const StyleLength& rhs) const {
    return value_ == rhs.value_ && unit_ == rhs.unit_;
  }

  constexpr bool inexactEquals(const StyleLength& other) const {
    return unit_ == other.unit_ &&
        facebook::yoga::inexactEquals(value_, other.value_);
  }

 private:
  // We intentionally do not allow direct construction using value and unit, to
  // avoid invalid, or redundant combinations.
  constexpr StyleLength(FloatOptional value, Unit unit)
      : value_(value), unit_(unit) {}

  FloatOptional value_{};
  Unit unit_{Unit::Undefined};
};

inline bool inexactEquals(const StyleLength& a, const StyleLength& b) {
  return a.inexactEquals(b);
}

} // namespace facebook::yoga
