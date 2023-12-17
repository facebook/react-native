/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <react/renderer/graphics/Float.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Contains a point in a two-dimensional coordinate system.
 */
struct Point {
  Float x{0};
  Float y{0};

  Point& operator+=(const Point& point) noexcept {
    x += point.x;
    y += point.y;
    return *this;
  }

  Point& operator-=(const Point& point) noexcept {
    x -= point.x;
    y -= point.y;
    return *this;
  }

  Point& operator*=(const Point& point) noexcept {
    x *= point.x;
    y *= point.y;
    return *this;
  }

  friend Point operator+(Point lhs, const Point& rhs) noexcept {
    return lhs += rhs;
  }

  friend Point operator-(Point lhs, const Point& rhs) noexcept {
    return lhs -= rhs;
  }
};

inline bool operator==(const Point& rhs, const Point& lhs) noexcept {
  return std::tie(lhs.x, lhs.y) == std::tie(rhs.x, rhs.y);
}

inline bool operator!=(const Point& rhs, const Point& lhs) noexcept {
  return !(lhs == rhs);
}

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::Point> {
  size_t operator()(const facebook::react::Point& point) const noexcept {
    return facebook::react::hash_combine(point.x, point.y);
  }
};

} // namespace std
