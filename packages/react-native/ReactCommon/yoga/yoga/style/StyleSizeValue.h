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
 * This class represents a CSS Value for sizes (e.g. width, height, min-width,
 * etc.). It may be one of:
 * 1. Undefined
 * 2. A keyword (e.g. auto, max-content, stretch, etc.)
 * 3. A CSS <length-percentage> value:
 *    a. <length> value (e.g. 10px)
 *    b. <percentage> value of a reference <length>
 * 4. (soon) A math function which returns a <length-percentage> value
 *
 * References:
 * 1. https://www.w3.org/TR/css-values-4/#lengths
 * 2. https://www.w3.org/TR/css-values-4/#percentage-value
 * 3. https://www.w3.org/TR/css-values-4/#mixed-percentages
 * 4. https://www.w3.org/TR/css-values-4/#math
 */
class StyleSizeValue {
 public:
  constexpr StyleSizeValue() = default;

  constexpr static StyleSizeValue points(float value) {
    return yoga::isUndefined(value) || yoga::isinf(value)
        ? undefined()
        : StyleSizeValue{FloatOptional{value}, Unit::Point};
  }

  constexpr static StyleSizeValue percent(float value) {
    return yoga::isUndefined(value) || yoga::isinf(value)
        ? undefined()
        : StyleSizeValue{FloatOptional{value}, Unit::Percent};
  }

  constexpr static StyleSizeValue ofAuto() {
    return StyleSizeValue{{}, Unit::Auto};
  }

  constexpr static StyleSizeValue ofMaxContent() {
    return StyleSizeValue{{}, Unit::MaxContent};
  }

  constexpr static StyleSizeValue ofFitContent() {
    return StyleSizeValue{{}, Unit::FitContent};
  }

  constexpr static StyleSizeValue ofStretch() {
    return StyleSizeValue{{}, Unit::Stretch};
  }

  constexpr static StyleSizeValue undefined() {
    return StyleSizeValue{{}, Unit::Undefined};
  }

  constexpr bool isAuto() const {
    return unit_ == Unit::Auto;
  }

  constexpr bool isMaxContent() const {
    return unit_ == Unit::MaxContent;
  }

  constexpr bool isFitContent() const {
    return unit_ == Unit::FitContent;
  }

  constexpr bool isStretch() const {
    return unit_ == Unit::Stretch;
  }

  constexpr bool isUndefined() const {
    return unit_ == Unit::Undefined;
  }

  constexpr bool isDefined() const {
    return !isUndefined();
  }

  constexpr FloatOptional value() const {
    return value_;
  }

  constexpr Unit unit() const {
    return unit_;
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

  constexpr bool operator==(const StyleSizeValue& rhs) const {
    return value_ == rhs.value_ && unit_ == rhs.unit_;
  }

 private:
  // We intentionally do not allow direct construction using value and unit, to
  // avoid invalid, or redundant combinations.
  constexpr StyleSizeValue(FloatOptional value, Unit unit)
      : value_(value), unit_(unit) {}

  FloatOptional value_{};
  Unit unit_{Unit::Undefined};
};

inline bool inexactEquals(const StyleSizeValue& a, const StyleSizeValue& b) {
  return a.unit() == b.unit() && inexactEquals(a.value(), b.value());
}

} // namespace facebook::yoga
