/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>
#include <optional>
#include <string>

namespace facebook::react {

struct ColorStop {
  bool operator==(const ColorStop& other) const = default;
  SharedColor color;
  std::optional<Float> position;
};

enum class GradientType {
  LinearGradient,
};

struct GradientValue {
  bool operator==(const GradientValue& other) const = default;

  GradientType type;
  Float startX;
  Float startY;
  Float endX;
  Float endY;
  std::vector<ColorStop> colorStops;
};

inline GradientType gradientTypeFromString(const std::string& gradientType) {
  if (gradientType == "linearGradient") {
    return GradientType::LinearGradient;
  } else {
    throw std::invalid_argument(std::string(gradientType));
  }
}

}; // namespace facebook::react
