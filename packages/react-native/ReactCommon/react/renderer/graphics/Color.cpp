/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Color.h"

namespace facebook::react {

bool isColorMeaningful(const SharedColor& color) noexcept {
  if (!color) {
    return false;
  }

  return colorComponentsFromColor(color).alpha > 0;
}

// Create Color from float RGBA values in [0, 1] range
SharedColor colorFromComponents(ColorComponents components) {
  return {hostPlatformColorFromComponents(components)};
}

// Read Color components in [0, 1] range
ColorComponents colorComponentsFromColor(SharedColor sharedColor) {
  return colorComponentsFromHostPlatformColor(*sharedColor);
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

} // namespace facebook::react
