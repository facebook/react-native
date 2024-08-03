/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <array>
#include <cmath>
#include <concepts>

#include <yoga/Yoga.h>

namespace facebook::yoga {

constexpr bool isUndefined(std::floating_point auto value) {
  return value != value;
}

constexpr bool isDefined(std::floating_point auto value) {
  return !isUndefined(value);
}

/**
 * Constexpr version of `std::isinf` before C++ 23
 */
constexpr bool isinf(auto value) {
  return value == +std::numeric_limits<decltype(value)>::infinity() ||
      value == -std::numeric_limits<decltype(value)>::infinity();
}

constexpr auto maxOrDefined(
    std::floating_point auto a,
    std::floating_point auto b) {
  if (yoga::isDefined(a) && yoga::isDefined(b)) {
    return std::max(a, b);
  }
  return yoga::isUndefined(a) ? b : a;
}

constexpr auto minOrDefined(
    std::floating_point auto a,
    std::floating_point auto b) {
  if (yoga::isDefined(a) && yoga::isDefined(b)) {
    return std::min(a, b);
  }

  return yoga::isUndefined(a) ? b : a;
}

// Custom equality functions using a hardcoded epsilon of 0.0001f, or returning
// true if both floats are NaN.
inline bool inexactEquals(float a, float b) {
  if (yoga::isDefined(a) && yoga::isDefined(b)) {
    return std::abs(a - b) < 0.0001f;
  }
  return yoga::isUndefined(a) && yoga::isUndefined(b);
}

inline bool inexactEquals(double a, double b) {
  if (yoga::isDefined(a) && yoga::isDefined(b)) {
    return std::abs(a - b) < 0.0001;
  }
  return yoga::isUndefined(a) && yoga::isUndefined(b);
}

template <std::size_t Size, typename ElementT>
bool inexactEquals(
    const std::array<ElementT, Size>& val1,
    const std::array<ElementT, Size>& val2) {
  bool areEqual = true;
  for (std::size_t i = 0; i < Size && areEqual; ++i) {
    areEqual = inexactEquals(val1[i], val2[i]);
  }
  return areEqual;
}

} // namespace facebook::yoga
