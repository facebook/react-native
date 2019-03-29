/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Color.h"

namespace facebook {
namespace react {

SharedColor colorFromComponents(ColorComponents components) {
  const CGFloat componentsArray[] = {
      components.red, components.green, components.blue, components.alpha};

  auto color = CGColorCreate(CGColorSpaceCreateDeviceRGB(), componentsArray);

  return SharedColor(color, CFRelease);
}

ColorComponents colorComponentsFromColor(SharedColor color) {
  if (!color) {
    // Empty color object can be considered as `clear` (black, fully
    // transparent) color.
    return ColorComponents{0, 0, 0, 0};
  }

  auto numberOfComponents = CGColorGetNumberOfComponents(color.get());
  assert(numberOfComponents == 4);
  const CGFloat *components = CGColorGetComponents(color.get());
  return ColorComponents{(float)components[0],
                         (float)components[1],
                         (float)components[2],
                         (float)components[3]};
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
