#pragma once

#include <react/renderer/graphics/Float.h>
#include <string>
#include <optional>
#include <react/renderer/graphics/Color.h>

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
