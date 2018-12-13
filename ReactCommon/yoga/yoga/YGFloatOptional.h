/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <cmath>
#include <limits>

struct YGFloatOptional {
 private:
  float value_ = std::numeric_limits<float>::quiet_NaN();

 public:
  explicit constexpr YGFloatOptional(float value) : value_(value) {}
  constexpr YGFloatOptional() = default;

  // returns the wrapped value, or a value x with YGIsUndefined(x) == true
  float unwrap() const {
    return value_;
  }

  bool isUndefined() const {
    return std::isnan(value_);
  }

  YGFloatOptional operator+(YGFloatOptional op) const;
  bool operator>(YGFloatOptional op) const;
  bool operator<(YGFloatOptional op) const;
  bool operator>=(YGFloatOptional op) const;
  bool operator<=(YGFloatOptional op) const;
  bool operator==(YGFloatOptional op) const;
  bool operator!=(YGFloatOptional op) const;

  bool operator==(float val) const;
  bool operator!=(float val) const;
};
