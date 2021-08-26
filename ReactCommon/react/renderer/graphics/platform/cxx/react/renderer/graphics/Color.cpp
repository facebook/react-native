/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Color.h"

namespace facebook {
namespace react {

bool isColorMeaningful(SharedColor const &color) noexcept {
  if (!color) {
    return false;
  }

  return colorComponentsFromColor(color).alpha > 0;
}

SharedColor colorFromComponents(ColorComponents components) {
  float ratio = 255;
  return SharedColor(
      ((int)round(components.alpha * ratio) & 0xff) << 24 |
      ((int)round(components.red * ratio) & 0xff) << 16 |
      ((int)round(components.green * ratio) & 0xff) << 8 |
      ((int)round(components.blue * ratio) & 0xff));
}

ColorComponents colorComponentsFromColor(SharedColor sharedColor) {
  float ratio = 255;
  Color color = *sharedColor;
  return ColorComponents{
      (float)((color >> 16) & 0xff) / ratio,
      (float)((color >> 8) & 0xff) / ratio,
      (float)((color >> 0) & 0xff) / ratio,
      (float)((color >> 24) & 0xff) / ratio};
}

SharedColor clearColor() {
  static SharedColor color = colorFromComponents(ColorComponents{0, 0, 0, 0});
  return color;
}

SharedColor blackColor() {
  static SharedColor color = colorFromComponents(ColorComponents{0, 0, 0, 1});
  return color;
}

SharedColor whiteColor() {
  static SharedColor color = colorFromComponents(ColorComponents{1, 1, 1, 1});
  return color;
}

} // namespace react
} // namespace facebook
