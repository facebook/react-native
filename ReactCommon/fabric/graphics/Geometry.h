// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <tuple>

#include <CoreGraphics/CGBase.h>

namespace facebook {
namespace react {

/*
 * Exact type of float numbers which ideally should match a type behing
 * platform- and chip-architecture-specific float type.
 */
using Float = CGFloat;

/*
 * Large positive number signifies that the `Float` values is `undefined`.
 */
const Float kFloatUndefined = CGFLOAT_MAX;

const Float kFloatMax = CGFLOAT_MAX;
const Float kFloatMin = CGFLOAT_MIN;

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
};

} // namespace react
} // namespace facebook
