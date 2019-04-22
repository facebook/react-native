/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <cmath>
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

  bool isUndefined() const {
    return std::isnan(value_);
  }

  YGFloatOptional operator+(YGFloatOptional op) const {
    return YGFloatOptional{value_ + op.value_};
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
