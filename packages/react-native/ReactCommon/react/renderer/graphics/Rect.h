/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <tuple>

#include <folly/Hash.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/Size.h>

namespace facebook {
namespace react {

/*
 * Contains the location and dimensions of a rectangle.
 */
struct Rect {
  Point origin{0, 0};
  Size size{0, 0};

  bool operator==(Rect const &rhs) const noexcept {
    return std::tie(this->origin, this->size) == std::tie(rhs.origin, rhs.size);
  }

  bool operator!=(Rect const &rhs) const noexcept {
    return !(*this == rhs);
  }

  Float getMaxX() const noexcept {
    return size.width > 0 ? origin.x + size.width : origin.x;
  }
  Float getMaxY() const noexcept {
    return size.height > 0 ? origin.y + size.height : origin.y;
  }
  Float getMinX() const noexcept {
    return size.width >= 0 ? origin.x : origin.x + size.width;
  }
  Float getMinY() const noexcept {
    return size.height >= 0 ? origin.y : origin.y + size.height;
  }
  Float getMidX() const noexcept {
    return origin.x + size.width / 2;
  }
  Float getMidY() const noexcept {
    return origin.y + size.height / 2;
  }
  Point getCenter() const noexcept {
    return {getMidX(), getMidY()};
  }

  void unionInPlace(Rect const &rect) noexcept {
    auto x1 = std::min(getMinX(), rect.getMinX());
    auto y1 = std::min(getMinY(), rect.getMinY());
    auto x2 = std::max(getMaxX(), rect.getMaxX());
    auto y2 = std::max(getMaxY(), rect.getMaxY());
    origin = {x1, y1};
    size = {x2 - x1, y2 - y1};
  }

  bool containsPoint(Point point) noexcept {
    return point.x >= origin.x && point.y >= origin.y &&
        point.x <= (origin.x + size.width) &&
        point.y <= (origin.y + size.height);
  }

  static Rect boundingRect(
      Point const &a,
      Point const &b,
      Point const &c,
      Point const &d) noexcept {
    auto leftTopPoint = a;
    auto rightBottomPoint = a;

    leftTopPoint.x = std::min(leftTopPoint.x, b.x);
    leftTopPoint.x = std::min(leftTopPoint.x, c.x);
    leftTopPoint.x = std::min(leftTopPoint.x, d.x);

    leftTopPoint.y = std::min(leftTopPoint.y, b.y);
    leftTopPoint.y = std::min(leftTopPoint.y, c.y);
    leftTopPoint.y = std::min(leftTopPoint.y, d.y);

    rightBottomPoint.x = std::max(rightBottomPoint.x, b.x);
    rightBottomPoint.x = std::max(rightBottomPoint.x, c.x);
    rightBottomPoint.x = std::max(rightBottomPoint.x, d.x);

    rightBottomPoint.y = std::max(rightBottomPoint.y, b.y);
    rightBottomPoint.y = std::max(rightBottomPoint.y, c.y);
    rightBottomPoint.y = std::max(rightBottomPoint.y, d.y);

    return {
        leftTopPoint,
        {rightBottomPoint.x - leftTopPoint.x,
         rightBottomPoint.y - leftTopPoint.y}};
  }
};

} // namespace react
} // namespace facebook

namespace std {

template <>
struct hash<facebook::react::Rect> {
  size_t operator()(facebook::react::Rect const &rect) const noexcept {
    return folly::hash::hash_combine(0, rect.origin, rect.size);
  }
};

} // namespace std
