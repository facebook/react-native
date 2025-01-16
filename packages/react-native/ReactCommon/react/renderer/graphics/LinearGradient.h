/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>
#include <string>
#include <variant>
#include <vector>

namespace facebook::react {

enum class GradientDirectionType { Angle, Keyword };

enum class GradientKeyword {
  ToTopRight,
  ToBottomRight,
  ToTopLeft,
  ToBottomLeft,
};

struct GradientDirection {
  GradientDirectionType type;
  std::variant<Float, GradientKeyword> value;

  bool operator==(const GradientDirection& other) const {
    return type == other.type && value == other.value;
  }
};

struct ColorStop {
  bool operator==(const ColorStop& other) const = default;
  SharedColor color;
  Float position = 0.0f;
};

struct LinearGradient {
  GradientDirection direction;
  std::vector<ColorStop> colorStops;

  bool operator==(const LinearGradient& other) const {
    return direction == other.direction && colorStops == other.colorStops;
  }
};

inline GradientKeyword parseGradientKeyword(const std::string& keyword) {
  if (keyword == "to top right")
    return GradientKeyword::ToTopRight;
  if (keyword == "to bottom right")
    return GradientKeyword::ToBottomRight;
  if (keyword == "to top left")
    return GradientKeyword::ToTopLeft;
  if (keyword == "to bottom left")
    return GradientKeyword::ToBottomLeft;
  throw std::invalid_argument("Invalid gradient keyword: " + keyword);
}

}; // namespace facebook::react
