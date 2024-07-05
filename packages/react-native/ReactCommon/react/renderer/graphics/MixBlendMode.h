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

enum class MixBlendMode {
  Normal,
  Multiply,
  Screen,
  Overlay,
  Darken,
  Lighten,
  ColorDodge,
  ColorBurn,
  HardLight,
  SoftLight,
  Difference,
  Exclusion,
  Hue,
  Saturation,
  Color,
  Luminosity,
};

inline MixBlendMode mixBlendModeFromString(std::string_view mixBlendModeName) {
  if (mixBlendModeName == "normal") {
    return MixBlendMode::Normal;
  } else if (mixBlendModeName == "multiply") {
    return MixBlendMode::Multiply;
  } else if (mixBlendModeName == "screen") {
    return MixBlendMode::Screen;
  } else if (mixBlendModeName == "overlay") {
    return MixBlendMode::Overlay;
  } else if (mixBlendModeName == "darken") {
    return MixBlendMode::Darken;
  } else if (mixBlendModeName == "lighten") {
    return MixBlendMode::Lighten;
  } else if (mixBlendModeName == "color-dodge") {
    return MixBlendMode::ColorDodge;
  } else if (mixBlendModeName == "color-burn") {
    return MixBlendMode::ColorBurn;
  } else if (mixBlendModeName == "hard-light") {
    return MixBlendMode::HardLight;
  } else if (mixBlendModeName == "soft-light") {
    return MixBlendMode::SoftLight;
  } else if (mixBlendModeName == "difference") {
    return MixBlendMode::Difference;
  } else if (mixBlendModeName == "exclusion") {
    return MixBlendMode::Exclusion;
  } else if (mixBlendModeName == "hue") {
    return MixBlendMode::Hue;
  } else if (mixBlendModeName == "saturation") {
    return MixBlendMode::Saturation;
  } else if (mixBlendModeName == "color") {
    return MixBlendMode::Color;
  } else if (mixBlendModeName == "luminosity") {
    return MixBlendMode::Luminosity;
  } else {
    throw std::invalid_argument(std::string(mixBlendModeName));
  }
}
} // namespace facebook::react
