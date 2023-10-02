/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <limits>

namespace facebook::yoga {

struct FloatOptional {
 private:
  float value_ = std::numeric_limits<float>::quiet_NaN();

 public:
  explicit constexpr FloatOptional(float value) : value_(value) {}
  constexpr FloatOptional() = default;

  // returns the wrapped value, or a value x with YGIsUndefined(x) == true
  constexpr float unwrap() const {
    return value_;
  }

  bool isUndefined() const {
    return std::isnan(value_);
  }
};

// operators take FloatOptional by value, as it is a 32bit value

inline bool operator==(FloatOptional lhs, FloatOptional rhs) {
  return lhs.unwrap() == rhs.unwrap() ||
      (lhs.isUndefined() && rhs.isUndefined());
}
inline bool operator!=(FloatOptional lhs, FloatOptional rhs) {
  return !(lhs == rhs);
}

inline bool operator==(FloatOptional lhs, float rhs) {
  return lhs == FloatOptional{rhs};
}
inline bool operator!=(FloatOptional lhs, float rhs) {
  return !(lhs == rhs);
}

inline bool operator==(float lhs, FloatOptional rhs) {
  return rhs == lhs;
}
inline bool operator!=(float lhs, FloatOptional rhs) {
  return !(lhs == rhs);
}

inline FloatOptional operator+(FloatOptional lhs, FloatOptional rhs) {
  return FloatOptional{lhs.unwrap() + rhs.unwrap()};
}

inline bool operator>(FloatOptional lhs, FloatOptional rhs) {
  return lhs.unwrap() > rhs.unwrap();
}

inline bool operator<(FloatOptional lhs, FloatOptional rhs) {
  return lhs.unwrap() < rhs.unwrap();
}

inline bool operator>=(FloatOptional lhs, FloatOptional rhs) {
  return lhs > rhs || lhs == rhs;
}

inline bool operator<=(FloatOptional lhs, FloatOptional rhs) {
  return lhs < rhs || lhs == rhs;
}

} // namespace facebook::yoga
