/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <folly/Hash.h>
#include <react/renderer/graphics/Float.h>

namespace facebook::react {

/*
 * Generic data structure describes some values associated with *corners*
 * of a rectangle.
 */
template <typename T>
struct RectangleCorners {
  T topLeft{};
  T topRight{};
  T bottomLeft{};
  T bottomRight{};

  bool operator==(const RectangleCorners<T>& rhs) const noexcept {
    return std::tie(
               this->topLeft,
               this->topRight,
               this->bottomLeft,
               this->bottomRight) ==
        std::tie(rhs.topLeft, rhs.topRight, rhs.bottomLeft, rhs.bottomRight);
  }

  bool operator!=(const RectangleCorners<T>& rhs) const noexcept {
    return !(*this == rhs);
  }

  bool isUniform() const noexcept {
    return topLeft == topRight && topLeft == bottomLeft &&
        topLeft == bottomRight;
  }
};

/*
 * CornerInsets
 */
using CornerInsets = RectangleCorners<Float>;

} // namespace facebook::react

namespace std {

template <typename T>
struct hash<facebook::react::RectangleCorners<T>> {
  size_t operator()(
      const facebook::react::RectangleCorners<T>& corners) const noexcept {
    return folly::hash::hash_combine(
        0,
        corners.topLeft,
        corners.bottomLeft,
        corners.topRight,
        corners.bottomRight);
  }
};

} // namespace std
