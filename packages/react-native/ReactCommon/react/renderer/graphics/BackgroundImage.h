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

enum class BackgroundImageType {
  LinearGradient,
};

struct BackgroundImagePrimitive {
  bool operator==(const BackgroundImagePrimitive& other) const = default;

  BackgroundImageType type;
  Float startX;
  Float startY;
  Float endX;
  Float endY;
  std::vector<ColorStop> colorStops;
};

inline BackgroundImageType gradientTypeFromString(const std::string& gradientType) {
  if (gradientType == "linearGradient") {
    return BackgroundImageType::LinearGradient;
  } else {
    throw std::invalid_argument(std::string(gradientType));
  }
}

}; // namespace facebook::react
