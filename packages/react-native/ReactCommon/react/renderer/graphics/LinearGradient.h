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

enum class GradientDirectionType {
  Angle,
  Keyword
};

struct GradientDirection {
  GradientDirectionType type;
  std::variant<Float, std::string> value;

  bool operator==(const GradientDirection& other) const {
    return type == other.type && value == other.value;
  }
};

struct ColorStop {
  bool operator==(const ColorStop& other) const = default;
  SharedColor color;
  Float position;
};

struct LinearGradient {
  GradientDirection direction;
  std::vector<ColorStop> colorStops;

  bool operator==(const LinearGradient& other) const {
    return direction == other.direction && colorStops == other.colorStops;
  }
};

}; // namespace facebook::react
