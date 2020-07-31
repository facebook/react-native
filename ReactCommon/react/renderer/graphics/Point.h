/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <folly/Hash.h>
#include <react/renderer/graphics/Float.h>

namespace facebook {
namespace react {

/*
 * Contains a point in a two-dimensional coordinate system.
 */
struct Point {
  Float x{0};
  Float y{0};

  Point &operator+=(Point const &point) noexcept {
    x += point.x;
    y += point.y;
    return *this;
  }

  Point &operator-=(Point const &point) noexcept {
    x -= point.x;
    y -= point.y;
    return *this;
  }

  Point &operator*=(Point const &point) noexcept {
    x *= point.x;
    y *= point.y;
    return *this;
  }

  friend Point operator+(Point lhs, Point const &rhs) noexcept {
    return lhs += rhs;
  }

  friend Point operator-(Point lhs, Point const &rhs) noexcept {
    return lhs -= rhs;
  }
};

inline bool operator==(Point const &rhs, Point const &lhs) noexcept {
  return std::tie(lhs.x, lhs.y) == std::tie(rhs.x, rhs.y);
}

inline bool operator!=(Point const &rhs, Point const &lhs) noexcept {
  return !(lhs == rhs);
}

} // namespace react
} // namespace facebook

namespace std {

template <>
struct hash<facebook::react::Point> {
  size_t operator()(facebook::react::Point const &point) const noexcept {
    return folly::hash::hash_combine(0, point.x, point.y);
  }
};

} // namespace std
