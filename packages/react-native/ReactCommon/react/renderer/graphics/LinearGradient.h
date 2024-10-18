/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>
#include <variant>
#include <string>
#include <react/renderer/graphics/Float.h>

namespace facebook::react {

enum class GradientOrientationType {
  Angle,
  Direction
};

struct GradientOrientation {
  GradientOrientationType type;
  std::variant<Float, std::string> value;

  bool operator==(const GradientOrientation& other) const {
    return type == other.type && value == other.value;
  }
};

struct ColorStop {
  bool operator==(const ColorStop& other) const = default;
  SharedColor color;
  Float position;
};

struct LinearGradient {
  GradientOrientation orientation;
  std::vector<ColorStop> colorStops;

  bool operator==(const LinearGradient& other) const {
    return orientation == other.orientation && colorStops == other.colorStops;
  }
};

}; // namespace facebook::react
