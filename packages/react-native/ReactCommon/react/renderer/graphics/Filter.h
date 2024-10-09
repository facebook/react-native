/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>

#include <string>
#include <string_view>
#include <vector>

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
  Sepia
};

struct FilterPrimitive {
  bool operator==(const FilterPrimitive& other) const = default;

  FilterType type;
  Float amount;
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
  } else {
    throw std::invalid_argument(std::string(filterName));
  }
}

} // namespace facebook::react
