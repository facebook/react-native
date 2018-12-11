/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/graphics/Color.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

#pragma mark - Color

inline void fromDynamic(const folly::dynamic &value, SharedColor &result) {
  float red;
  float green;
  float blue;
  float alpha;

  if (value.isNumber()) {
    auto argb = value.asInt();
    auto ratio = 256.f;
    alpha = ((argb >> 24) & 0xFF) / ratio;
    red = ((argb >> 16) & 0xFF) / ratio;
    green = ((argb >> 8) & 0xFF) / ratio;
    blue = (argb & 0xFF) / ratio;
  } else if (value.isArray()) {
    auto size = value.size();
    assert(size == 3 || size == 4);
    red = value[0].asDouble();
    green = value[1].asDouble();
    blue = value[2].asDouble();
    alpha = size == 4 ? value[3].asDouble() : 1.0;
  } else {
    abort();
  }

  result = colorFromComponents({red, green, blue, alpha});
}

inline folly::dynamic toDynamic(const SharedColor &color) {
  ColorComponents components = colorComponentsFromColor(color);
  auto ratio = 256.f;
  return (
      ((int)(components.alpha * ratio) & 0xff) << 24 |
      ((int)(components.red * ratio) & 0xff) << 16 |
      ((int)(components.green * ratio) & 0xff) << 8 |
      ((int)(components.blue * ratio) & 0xff));
}

inline std::string toString(const SharedColor &value) {
  ColorComponents components = colorComponentsFromColor(value);
  auto ratio = 256.f;
  return "rgba(" + folly::to<std::string>(round(components.red * ratio)) +
      ", " + folly::to<std::string>(round(components.green * ratio)) + ", " +
      folly::to<std::string>(round(components.blue * ratio)) + ", " +
      folly::to<std::string>(round(components.alpha * ratio)) + ")";
}

#pragma mark - Geometry

inline void fromDynamic(const folly::dynamic &value, Point &result) {
  if (value.isObject()) {
    result = Point{(Float)value["x"].asDouble(), (Float)value["y"].asDouble()};
    return;
  }
  if (value.isArray()) {
    result = Point{(Float)value[0].asDouble(), (Float)value[1].asDouble()};
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, Size &result) {
  if (value.isObject()) {
    result = Size{(Float)value["width"].asDouble(),
                  (Float)value["height"].asDouble()};
    return;
  }
  if (value.isArray()) {
    result = Size{(Float)value[0].asDouble(), (Float)value[1].asDouble()};
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, EdgeInsets &result) {
  if (value.isNumber()) {
    const Float number = value.asDouble();
    result = EdgeInsets{number, number, number, number};
    return;
  }
  if (value.isObject()) {
    result = EdgeInsets{(Float)value["top"].asDouble(),
                        (Float)value["left"].asDouble(),
                        (Float)value["bottom"].asDouble(),
                        (Float)value["right"].asDouble()};
    return;
  }
  if (value.isArray()) {
    result = EdgeInsets{(Float)value[0].asDouble(),
                        (Float)value[1].asDouble(),
                        (Float)value[2].asDouble(),
                        (Float)value[3].asDouble()};
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, CornerInsets &result) {
  if (value.isNumber()) {
    const Float number = value.asDouble();
    result = CornerInsets{number, number, number, number};
    return;
  }
  if (value.isObject()) {
    result = CornerInsets{(Float)value["topLeft"].asDouble(),
                          (Float)value["topRight"].asDouble(),
                          (Float)value["bottomLeft"].asDouble(),
                          (Float)value["bottomRight"].asDouble()};
    return;
  }
  if (value.isArray()) {
    result = CornerInsets{(Float)value[0].asDouble(),
                          (Float)value[1].asDouble(),
                          (Float)value[2].asDouble(),
                          (Float)value[3].asDouble()};
    return;
  }
  abort();
}

inline std::string toString(const Point &point) {
  return "{" + folly::to<std::string>(point.x) + ", " +
      folly::to<std::string>(point.y) + "}";
}

inline std::string toString(const Size &size) {
  return "{" + folly::to<std::string>(size.width) + ", " +
      folly::to<std::string>(size.height) + "}";
}

inline std::string toString(const Rect &rect) {
  return "{" + toString(rect.origin) + ", " + toString(rect.size) + "}";
}

inline std::string toString(const EdgeInsets &edgeInsets) {
  return "{" + folly::to<std::string>(edgeInsets.left) + ", " +
      folly::to<std::string>(edgeInsets.top) + ", " +
      folly::to<std::string>(edgeInsets.right) + ", " +
      folly::to<std::string>(edgeInsets.bottom) + "}";
}

inline std::string toString(const CornerInsets &cornerInsets) {
  return "{" + folly::to<std::string>(cornerInsets.topLeft) + ", " +
      folly::to<std::string>(cornerInsets.topRight) + ", " +
      folly::to<std::string>(cornerInsets.bottomLeft) + ", " +
      folly::to<std::string>(cornerInsets.bottomRight) + "}";
}

} // namespace react
} // namespace facebook
