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
#include <optional>
#include <string>
#include <variant>
#include <vector>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

enum class RadialGradientShape { Circle, Ellipse };

#ifdef RN_SERIALIZABLE_STATE
inline std::string toString(const RadialGradientShape& radialGradientShape) {
  switch (radialGradientShape) {
    case RadialGradientShape::Circle:
      return "circle";
    case RadialGradientShape::Ellipse:
      return "ellipse";
  }

  return "";
}
#endif

struct RadialGradientSize {
  enum class SizeKeyword {
    ClosestSide,
    FarthestSide,
    ClosestCorner,
    FarthestCorner
  };

  struct Dimensions {
    ValueUnit x;
    ValueUnit y;

    bool operator==(const Dimensions& other) const {
      return x == other.x && y == other.y;
    }
    bool operator!=(const Dimensions& other) const {
      return !(*this == other);
    }

#ifdef RN_SERIALIZABLE_STATE
    folly::dynamic toDynamic() const {
      folly::dynamic result = folly::dynamic::object();
      result["x"] = x.toDynamic();
      result["y"] = y.toDynamic();
      return result;
    }
#endif
  };

  std::variant<SizeKeyword, Dimensions> value;

  bool operator==(const RadialGradientSize& other) const {
    if (std::holds_alternative<SizeKeyword>(value) &&
        std::holds_alternative<SizeKeyword>(other.value)) {
      return std::get<SizeKeyword>(value) == std::get<SizeKeyword>(other.value);
    } else if (
        std::holds_alternative<Dimensions>(value) &&
        std::holds_alternative<Dimensions>(other.value)) {
      return std::get<Dimensions>(value) == std::get<Dimensions>(other.value);
    }
    return false;
  }

  bool operator!=(const RadialGradientSize& other) const {
    return !(*this == other);
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const {
    if (std::holds_alternative<SizeKeyword>(value)) {
      switch (std::get<SizeKeyword>(value)) {
        case SizeKeyword::ClosestSide:
          return "closest-side";
        case SizeKeyword::FarthestSide:
          return "farthest-side";
        case SizeKeyword::ClosestCorner:
          return "closest-corner";
        case SizeKeyword::FarthestCorner:
          return "farthest-corner";
      }
    } else if (std::holds_alternative<Dimensions>(value)) {
      return std::get<Dimensions>(value).toDynamic();
    }

    return nullptr;
  }
#endif
};

struct RadialGradientPosition {
  std::optional<ValueUnit> top;
  std::optional<ValueUnit> left;
  std::optional<ValueUnit> right;
  std::optional<ValueUnit> bottom;

  bool operator==(const RadialGradientPosition& other) const {
    return top == other.top && left == other.left && right == other.right &&
        bottom == other.bottom;
  }

  bool operator!=(const RadialGradientPosition& other) const {
    return !(*this == other);
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const {
    folly::dynamic result = folly::dynamic::object();
    if (top.has_value()) {
      result["top"] = top.value().toDynamic();
    }
    if (left.has_value()) {
      result["left"] = left.value().toDynamic();
    }
    if (right.has_value()) {
      result["right"] = right.value().toDynamic();
    }
    if (bottom.has_value()) {
      result["bottom"] = bottom.value().toDynamic();
    }
    return result;
  }
#endif
};

struct RadialGradient {
  RadialGradientShape shape;
  RadialGradientSize size;
  RadialGradientPosition position;
  std::vector<ColorStop> colorStops;

  bool operator==(const RadialGradient& other) const {
    return shape == other.shape && size == other.size &&
        position == other.position && colorStops == other.colorStops;
  }
  bool operator!=(const RadialGradient& other) const {
    return !(*this == other);
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const {
    folly::dynamic result = folly::dynamic::object();
    result["type"] = "radial-gradient";
    result["shape"] = toString(shape);
    result["size"] = size.toDynamic();
    result["position"] = position.toDynamic();

    folly::dynamic colorStopsArray = folly::dynamic::array();
    for (const auto& colorStop : colorStops) {
      colorStopsArray.push_back(colorStop.toDynamic());
    }
    result["colorStops"] = colorStopsArray;

    return result;
  }
#endif
};

}; // namespace facebook::react
