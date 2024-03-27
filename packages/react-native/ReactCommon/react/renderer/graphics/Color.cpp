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

  // On some host platforms, semantic colors can only be resolved from the UI
  // thread. Since this method is called by ViewShadowNode to determine whether
  // a color should disable view flattening from a background thread, we need
  // an alternative option to simply check if the color instance represents a
  // semantic color. The host platform implementation of this method only needs
  // to return true if it requries UI thread bound semantic color resolution.
  return hasPlatformColor(*color) || colorComponentsFromColor(color).alpha > 0;
}

SharedColor colorFromComponents(ColorComponents components) {
  return {hostPlatformColorFromComponents(components)};
}

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
