/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <folly/dynamic.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Geometry.h>

namespace facebook {
namespace react {

#pragma mark - Color

inline void fromRawValue(const RawValue &value, SharedColor &result) {
  float red;
  float green;
  float blue;
  float alpha;

  if (value.hasType<int>()) {
    auto argb = (int64_t)value;
    auto ratio = 255.f;
    alpha = ((argb >> 24) & 0xFF) / ratio;
    red = ((argb >> 16) & 0xFF) / ratio;
    green = ((argb >> 8) & 0xFF) / ratio;
    blue = (argb & 0xFF) / ratio;
  } else if (value.hasType<std::vector<float>>()) {
    auto items = (std::vector<float>)value;
    auto length = items.size();
    assert(length == 3 || length == 4);
    red = items.at(0);
    green = items.at(1);
    blue = items.at(2);
    alpha = length == 4 ? items.at(3) : 1.0;
  } else {
    abort();
  }
  result = colorFromComponents({red, green, blue, alpha});
}

#ifdef ANDROID

inline folly::dynamic toDynamic(const SharedColor &color) {
  ColorComponents components = colorComponentsFromColor(color);
  auto ratio = 255.f;
  return (
      ((int)(components.alpha * ratio) & 0xff) << 24 |
      ((int)(components.red * ratio) & 0xff) << 16 |
      ((int)(components.green * ratio) & 0xff) << 8 |
      ((int)(components.blue * ratio) & 0xff));
}

#endif

inline std::string toString(const SharedColor &value) {
  ColorComponents components = colorComponentsFromColor(value);
  auto ratio = 255.f;
  return "rgba(" + folly::to<std::string>(round(components.red * ratio)) +
      ", " + folly::to<std::string>(round(components.green * ratio)) + ", " +
      folly::to<std::string>(round(components.blue * ratio)) + ", " +
      folly::to<std::string>(round(components.alpha * ratio)) + ")";
}

#pragma mark - Geometry

inline void fromRawValue(const RawValue &value, Point &result) {
  if (value.hasType<better::map<std::string, Float>>()) {
    auto map = (better::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "x") {
        result.x = pair.second;
      } else if (pair.first == "y") {
        result.y = pair.second;
      }
    }
    return;
  }

  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    assert(array.size() == 2);
    result = {array.at(0), array.at(1)};
    return;
  }

  abort();
}

inline void fromRawValue(const RawValue &value, Size &result) {
  if (value.hasType<better::map<std::string, Float>>()) {
    auto map = (better::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "width") {
        result.width = pair.second;
      } else if (pair.first == "height") {
        result.height = pair.second;
      }
    }
    return;
  }

  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    assert(array.size() == 2);
    result = {array.at(0), array.at(1)};
    return;
  }

  abort();
}

inline void fromRawValue(const RawValue &value, EdgeInsets &result) {
  if (value.hasType<Float>()) {
    auto number = (Float)value;
    result = {number, number, number, number};
  }

  if (value.hasType<better::map<std::string, Float>>()) {
    auto map = (better::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "top") {
        result.top = pair.second;
      } else if (pair.first == "left") {
        result.left = pair.second;
      } else if (pair.first == "bottom") {
        result.bottom = pair.second;
      } else if (pair.first == "right") {
        result.right = pair.second;
      }
    }
    return;
  }

  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    assert(array.size() == 4);
    result = {array.at(0), array.at(1), array.at(2), array.at(3)};
    return;
  }

  abort();
}

inline void fromRawValue(const RawValue &value, CornerInsets &result) {
  if (value.hasType<Float>()) {
    auto number = (Float)value;
    result = {number, number, number, number};
  }

  if (value.hasType<better::map<std::string, Float>>()) {
    auto map = (better::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "topLeft") {
        result.topLeft = pair.second;
      } else if (pair.first == "topRight") {
        result.topRight = pair.second;
      } else if (pair.first == "bottomLeft") {
        result.bottomLeft = pair.second;
      } else if (pair.first == "bottomRight") {
        result.bottomRight = pair.second;
      }
    }
    return;
  }

  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    assert(array.size() == 4);
    result = {array.at(0), array.at(1), array.at(2), array.at(3)};
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
