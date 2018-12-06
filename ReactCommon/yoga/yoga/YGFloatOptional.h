/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <limits>
#include "Yoga-internal.h"

struct YGFloatOptional {
 private:
  float value_ = std::numeric_limits<float>::quiet_NaN();

 public:
  explicit constexpr YGFloatOptional(float value) : value_(value) {}
  constexpr YGFloatOptional() = default;

  // returns the wrapped value, or a value x with YGIsUndefined(x) == true
  constexpr float unwrap() const {
    return value_;
  }

  constexpr bool isUndefined() const {
    // std::isnan is not constexpr
    return !(value_ == value_);
  }

  constexpr float orElse(float other) const {
    return isUndefined() ? other : value_;
  }

  template <typename Factory>
  constexpr float orElseGet(Factory&& f) const {
    return isUndefined() ? f() : value_;
  }

  YGFloatOptional operator-() const {
    return YGFloatOptional{-value_};
  }
  YGFloatOptional operator+(YGFloatOptional op) const {
    return YGFloatOptional{value_ + op.value_};
  }
  YGFloatOptional operator-(YGFloatOptional op) const {
    return YGFloatOptional{value_ - op.value_};
  }
  bool operator>(YGFloatOptional op) const {
    return value_ > op.value_;
  }
  bool operator<(YGFloatOptional op) const {
    return value_ < op.value_;
  }
  bool operator>=(YGFloatOptional op) const {
    return *this > op || *this == op;
  }
  bool operator<=(YGFloatOptional op) const {
    return *this < op || *this == op;
  }
  bool operator==(YGFloatOptional op) const {
    return value_ == op.value_ || (isUndefined() && op.isUndefined());
  }
  bool operator!=(YGFloatOptional op) const {
    return !(*this == op);
  }

  bool operator==(float val) const {
    return value_ == val || (isUndefined() && yoga::isUndefined(val));
  }
  bool operator!=(float val) const {
    return !(*this == val);
  }
};
