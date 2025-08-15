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

namespace facebook::react {

enum class RadialGradientShape { Circle, Ellipse };

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
};

}; // namespace facebook::react
