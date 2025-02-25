/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>

#include <string>
#include <string_view>
#include <variant>

namespace facebook::react {

enum class FilterType {
  Blur,
  Brightness,
  Contrast,
  Grayscale,
  HueRotate,
  Invert,
  Opacity,
  Saturate,
  Sepia,
  DropShadow
};

struct DropShadowParams {
  bool operator==(const DropShadowParams& other) const = default;

  Float offsetX{};
  Float offsetY{};
  Float standardDeviation{};
  SharedColor color{};
};

struct FilterFunction {
  bool operator==(const FilterFunction& other) const = default;

  FilterType type{};
  std::variant<Float, DropShadowParams> parameters{};
};

inline FilterType filterTypeFromString(std::string_view filterName) {
  if (filterName == "blur") {
    return FilterType::Blur;
  } else if (filterName == "brightness") {
    return FilterType::Brightness;
  } else if (filterName == "contrast") {
    return FilterType::Contrast;
  } else if (filterName == "grayscale") {
    return FilterType::Grayscale;
  } else if (filterName == "hueRotate") {
    return FilterType::HueRotate;
  } else if (filterName == "invert") {
    return FilterType::Invert;
  } else if (filterName == "opacity") {
    return FilterType::Opacity;
  } else if (filterName == "saturate") {
    return FilterType::Saturate;
  } else if (filterName == "sepia") {
    return FilterType::Sepia;
  } else if (filterName == "dropShadow") {
    return FilterType::DropShadow;
  } else {
    throw std::invalid_argument(std::string(filterName));
  }
}

} // namespace facebook::react
