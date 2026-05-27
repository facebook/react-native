/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Color.h"

#include <array>

namespace facebook::react {

std::string SharedColor::toString() const noexcept {
  ColorComponents components = colorComponentsFromColor(*this);
  std::array<char, 255> buffer{};
  std::snprintf(
      buffer.data(),
      buffer.size(),
      "rgba(%.0f, %.0f, %.0f, %g)",
      components.red * 255.f,
      components.green * 255.f,
      components.blue * 255.f,
      components.alpha);
  return buffer.data();
}

bool isColorMeaningful(const SharedColor& color) noexcept {
  if (!color) {
    return false;
  }

  return hostPlatformColorIsColorMeaningful(*color);
}

// Create Color from float RGBA values in [0, 1] range
SharedColor colorFromComponents(ColorComponents components) {
  return {hostPlatformColorFromComponents(components)};
}

// Read Color components in [0, 1] range
ColorComponents colorComponentsFromColor(SharedColor sharedColor) {
  return colorComponentsFromHostPlatformColor(*sharedColor);
}

// Read alpha channel in [0, 255] range
uint8_t alphaFromColor(SharedColor color) noexcept {
  return static_cast<uint8_t>(std::round(alphaFromHostPlatformColor(*color)));
}

// Read red channel in [0, 255] range
uint8_t redFromColor(SharedColor color) noexcept {
  return static_cast<uint8_t>(std::round(redFromHostPlatformColor(*color)));
}

// Read green channel in [0, 255] range
uint8_t greenFromColor(SharedColor color) noexcept {
  return static_cast<uint8_t>(std::round(greenFromHostPlatformColor(*color)));
}

// Read blue channel in [0, 255] range
uint8_t blueFromColor(SharedColor color) noexcept {
  return static_cast<uint8_t>(std::round(blueFromHostPlatformColor(*color)));
}

// Create Color with RGBA values in [0, 255] range
SharedColor colorFromRGBA(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
  return {hostPlatformColorFromRGBA(r, g, b, a)};
}

SharedColor clearColor() {
  static SharedColor color = colorFromComponents(
      ColorComponents{.red = 0, .green = 0, .blue = 0, .alpha = 0});
  return color;
}

SharedColor blackColor() {
  static SharedColor color = colorFromComponents(
      ColorComponents{.red = 0, .green = 0, .blue = 0, .alpha = 1});
  return color;
}

SharedColor whiteColor() {
  static SharedColor color = colorFromComponents(
      ColorComponents{.red = 1, .green = 1, .blue = 1, .alpha = 1});
  return color;
}

} // namespace facebook::react
