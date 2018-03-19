// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

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
};

/*
 * Size
 */
struct Size {
  Float width {0};
  Float height {0};
};

/*
 * Rect: Point and Size
 */
struct Rect {
  Point origin {0, 0};
  Size size {0, 0};
};

/*
 * EdgeInsets
 */
struct EdgeInsets {
  Float top {0};
  Float left {0};
  Float bottom {0};
  Float right {0};
};

} // namespace react
} // namespace facebook
