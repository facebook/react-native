/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ColorStop.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <string>
#include <variant>
#include <vector>

namespace facebook::react {

enum class GradientDirectionType { Angle, Keyword };

inline std::string toString(
    const GradientDirectionType& gradientDirectionType) {
  switch (gradientDirectionType) {
    case GradientDirectionType::Angle:
      return "angle";
    case GradientDirectionType::Keyword:
      return "keyword";
  }

  return "";
}

enum class GradientKeyword {
  ToTopRight,
  ToBottomRight,
  ToTopLeft,
  ToBottomLeft,
};

inline std::string toString(const GradientKeyword& gradientKeyword) {
  switch (gradientKeyword) {
    case GradientKeyword::ToTopRight:
      return "to top right";
    case GradientKeyword::ToBottomRight:
      return "to bottom right";
    case GradientKeyword::ToTopLeft:
      return "to top left";
    case GradientKeyword::ToBottomLeft:
      return "to bottom left";
  }

  return "";
}

struct GradientDirection {
  GradientDirectionType type;
  std::variant<Float, GradientKeyword> value;

  bool operator==(const GradientDirection& other) const {
    return type == other.type && value == other.value;
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const {
    folly::dynamic result = folly::dynamic::object();
    result["type"] = toString(type);

    if (std::holds_alternative<Float>(value)) {
      result["value"] = std::get<Float>(value);
    } else if (std::holds_alternative<GradientKeyword>(value)) {
      result["value"] = toString(std::get<GradientKeyword>(value));
    }
    return result;
  }
#endif
};

struct LinearGradient {
  GradientDirection direction;
  std::vector<ColorStop> colorStops;

  bool operator==(const LinearGradient& other) const {
    return direction == other.direction && colorStops == other.colorStops;
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const {
    folly::dynamic result = folly::dynamic::object();
    result["type"] = "linear-gradient";
    result["direction"] = direction.toDynamic();

    folly::dynamic colorStopsArray = folly::dynamic::array();
    for (const auto& colorStop : colorStops) {
      colorStopsArray.push_back(colorStop.toDynamic());
    }
    result["colorStops"] = colorStopsArray;
    return result;
  }
#endif
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
