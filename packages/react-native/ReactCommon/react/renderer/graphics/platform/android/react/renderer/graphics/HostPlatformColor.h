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

inline Color hostPlatformColorFromComponents(ColorComponents components) {
  if (components.colorSpace == ColorSpace::DisplayP3) {
    int ratio = 15360;
    int red = static_cast<int>(round(components.red * ratio)) & 0xffff;
    int green = static_cast<int>(round(components.green * ratio)) & 0xffff;
    int blue = static_cast<int>(round(components.blue * ratio)) & 0xffff;
    int alpha = static_cast<int>(round(components.alpha * 0x3ff)) & 0x3ff;
    int colorSpace = 7;
    int64_t androidColor = (static_cast<int64_t>(red) << 48) |
                          (static_cast<int64_t>(green) << 32) |
                          (static_cast<int64_t>(blue) << 16) |
                          (static_cast<int64_t>(alpha) << 6) |
                          static_cast<int64_t>(colorSpace);
    return androidColor;
  } else {
    int ratio = 255;
    int alpha = static_cast<int>(round(components.alpha * ratio)) & 0xff;
    int red = static_cast<int>(round(components.red * ratio)) & 0xff;
    int green = static_cast<int>(round(components.green * ratio)) & 0xff;
    int blue = static_cast<int>(round(components.blue * ratio)) & 0xff;
    int64_t androidColor = (static_cast<int64_t>(alpha) << 56) |
                          (static_cast<int64_t>(red) << 48) |
                          (static_cast<int64_t>(green) << 40) |
                          (static_cast<int64_t>(blue) << 32);
    return androidColor;
  }
}

inline ColorComponents colorComponentsFromHostPlatformColor(Color color) {
  if ((color & 0x3f) == 7) {
    int ratio = 15360;
    return ColorComponents{
      (float)((color >> 48) & 0xffff) / ratio,
      (float)((color >> 32) & 0xffff) / ratio,
      (float)((color >> 16) & 0xffff) / ratio,
      (float)((color >> 6) & 0x3ff) / ratio,
      ColorSpace::DisplayP3};
  } else {
    int ratio = 255;
    return ColorComponents{
      (float)((color >> 48) & 0xff) / ratio,
      (float)((color >> 40) & 0xff) / ratio,
      (float)((color >> 32) & 0xff) / ratio,
      (float)((color >> 56) & 0xff) / ratio,
      ColorSpace::sRGB};
  }
}

} // namespace facebook::react
