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
#include <react/renderer/graphics/Point.h>

namespace facebook::react {

/*
 * Contains width and height values.
 */
struct Size {
  Float width{0};
  Float height{0};

  Size& operator+=(const Point& point) noexcept {
    width += point.x;
    height += point.y;
    return *this;
  }

  Size& operator*=(const Point& point) noexcept {
    width *= point.x;
    height *= point.y;
    return *this;
  }
};

inline bool operator==(const Size& rhs, const Size& lhs) noexcept {
  return std::tie(lhs.width, lhs.height) == std::tie(rhs.width, rhs.height);
}

inline bool operator!=(const Size& rhs, const Size& lhs) noexcept {
  return !(lhs == rhs);
}

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::Size> {
  size_t operator()(const facebook::react::Size& size) const {
    return folly::hash::hash_combine(0, size.width, size.height);
  }
};

} // namespace std
