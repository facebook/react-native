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

  // Program will terminate if the value of an undefined is accessed. Please
  // make sure to check if the optional is defined before calling this function.
  // To check if float optional is defined, use `isUndefined()`.
  float getValue() const;

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
