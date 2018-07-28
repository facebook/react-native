// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <algorithm>
#include <tuple>

#include <fabric/graphics/Float.h>

namespace facebook {
namespace react {

/*
 * Point
 */
struct Point {
  Float x {0};
  Float y {0};

  Point& operator += (const Point& rhs) {
    x += rhs.x;
    y += rhs.y;
    return *this;
  }

  friend Point operator + (Point lhs, const Point& rhs) {
    return lhs += rhs;
  }

  bool operator ==(const Point& rhs) const {
    return
      std::tie(this->x, this->y) ==
      std::tie(rhs.x, rhs.y);
  }

  bool operator !=(const Point& rhs) const {
    return !(*this == rhs);
  }
};

/*
 * Size
 */
struct Size {
  Float width {0};
  Float height {0};

  bool operator ==(const Size& rhs) const {
    return
      std::tie(this->width, this->height) ==
      std::tie(rhs.width, rhs.height);
  }

  bool operator !=(const Size& rhs) const {
    return !(*this == rhs);
  }
};

/*
 * Rect: Point and Size
 */
struct Rect {
  Point origin {0, 0};
  Size size {0, 0};

  bool operator ==(const Rect& rhs) const {
    return
      std::tie(this->origin, this->size) ==
      std::tie(rhs.origin, rhs.size);
  }

  bool operator !=(const Rect& rhs) const {
    return !(*this == rhs);
  }

  Float getMaxX() const { return size.width > 0 ? origin.x + size.width : origin.x; }
  Float getMaxY() const { return size.height > 0 ? origin.y + size.height : origin.y; }
  Float getMinX() const { return size.width >= 0 ? origin.x : origin.x + size.width; }
  Float getMinY() const { return size.height >= 0 ? origin.y : origin.y + size.height; }

  void unionInPlace(const Rect &rect) {
    Float x1 = std::min(getMinX(), rect.getMinX());
    Float y1 = std::min(getMinY(), rect.getMinY());
    Float x2 = std::max(getMaxX(), rect.getMaxX());
    Float y2 = std::max(getMaxY(), rect.getMaxY());
    origin = {x1, y1};
    size = {x2 - x1, y2 - y1};
  }
};

/*
 * EdgeInsets
 */
struct EdgeInsets {
  Float left {0};
  Float top {0};
  Float right {0};
  Float bottom {0};

  bool operator ==(const EdgeInsets& rhs) const {
    return
      std::tie(this->left, this->top, this->right, this->bottom) ==
      std::tie(rhs.left, rhs.top, rhs.right, rhs.bottom);
  }

  bool operator !=(const EdgeInsets& rhs) const {
    return !(*this == rhs);
  }

  bool isUniform() const {
    return left == top &&
      left == right &&
      left == bottom;
  }
};

/*
 * CornerInsets
 */
struct CornerInsets {
  Float topLeft {0};
  Float topRight {0};
  Float bottomLeft {0};
  Float bottomRight {0};

  bool operator ==(const CornerInsets& rhs) const {
    return
    std::tie(this->topLeft, this->topRight, this->bottomLeft, this->bottomRight) ==
    std::tie(rhs.topLeft, rhs.topRight, rhs.bottomLeft, rhs.bottomRight);
  }

  bool operator !=(const CornerInsets& rhs) const {
    return !(*this == rhs);
  }

  bool isUniform() const {
    return topLeft == topRight &&
      topLeft == bottomLeft &&
      topLeft == bottomRight;
  }
};

} // namespace react
} // namespace facebook
