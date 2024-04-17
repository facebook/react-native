/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ColorComponents.h>
#include <cmath>

namespace facebook::react {

using Color = int64_t;

namespace HostPlatformColor {
static const facebook::react::Color UndefinedColor =
    std::numeric_limits<facebook::react::Color>::max();
}

// As defined by Android's ColorSpace.Named
constexpr int kDisplayP3ColorSpace = 7;
// DisplayP3 component range per Android's Color longs
constexpr int kDisplayP3Ratio = 15360;
// sRGB component range
constexpr int kSRGBRatio = 255;

inline Color hostPlatformColorFromComponents(ColorComponents components) {
  if (components.colorSpace == ColorSpace::DisplayP3) {
    int red = static_cast<int>(round(components.red * kDisplayP3Ratio)) & 0xffff;
    int green = static_cast<int>(round(components.green * kDisplayP3Ratio)) & 0xffff;
    int blue = static_cast<int>(round(components.blue * kDisplayP3Ratio)) & 0xffff;
    int alpha = static_cast<int>(round(components.alpha * 0x3ff)) & 0x3ff;
    int64_t androidColor = (static_cast<int64_t>(red) << 48) |
                          (static_cast<int64_t>(green) << 32) |
                          (static_cast<int64_t>(blue) << 16) |
                          (static_cast<int64_t>(alpha) << 6) |
                          static_cast<int64_t>(kDisplayP3ColorSpace);
    return androidColor;
  } else {
    int alpha = static_cast<int>(round(components.alpha * kSRGBRatio)) & 0xff;
    int red = static_cast<int>(round(components.red * kSRGBRatio)) & 0xff;
    int green = static_cast<int>(round(components.green * kSRGBRatio)) & 0xff;
    int blue = static_cast<int>(round(components.blue * kSRGBRatio)) & 0xff;
    int64_t androidColor = (static_cast<int64_t>(alpha) << 56) |
                          (static_cast<int64_t>(red) << 48) |
                          (static_cast<int64_t>(green) << 40) |
                          (static_cast<int64_t>(blue) << 32);
    return androidColor;
  }
}

inline ColorComponents colorComponentsFromHostPlatformColor(Color color) {
  if ((color & 0x3f) == kDisplayP3ColorSpace) {
    return ColorComponents{
      (float)((color >> 48) & 0xffff) / kDisplayP3Ratio,
      (float)((color >> 32) & 0xffff) / kDisplayP3Ratio,
      (float)((color >> 16) & 0xffff) / kDisplayP3Ratio,
      (float)((color >> 6) & 0x3ff) / kDisplayP3Ratio,
      ColorSpace::DisplayP3};
  } else {
    return ColorComponents{
      (float)((color >> 48) & 0xff) / kSRGBRatio,
      (float)((color >> 40) & 0xff) / kSRGBRatio,
      (float)((color >> 32) & 0xff) / kSRGBRatio,
      (float)((color >> 56) & 0xff) / kSRGBRatio,
      ColorSpace::sRGB};
  }
}

} // namespace facebook::react
