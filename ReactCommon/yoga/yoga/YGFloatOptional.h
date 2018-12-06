/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

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

  YGFloatOptional operator-() const;
  YGFloatOptional operator+(YGFloatOptional op) const;
  YGFloatOptional operator-(YGFloatOptional op) const;
  bool operator>(YGFloatOptional op) const;
  bool operator<(YGFloatOptional op) const;
  bool operator>=(YGFloatOptional op) const;
  bool operator<=(YGFloatOptional op) const;
  bool operator==(YGFloatOptional op) const;
  bool operator!=(YGFloatOptional op) const;

  bool operator==(float val) const;
  bool operator!=(float val) const;
};
