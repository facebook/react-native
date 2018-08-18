/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Color.h"

namespace facebook {
namespace react {

SharedColor colorFromComponents(ColorComponents components) {
  const CGFloat componentsArray[] = {
    components.red,
    components.green,
    components.blue,
    components.alpha
  };

  CGColorRef color = CGColorCreate(
    CGColorSpaceCreateDeviceRGB(),
    componentsArray
  );

  return SharedColor(color, CFRelease);
}

ColorComponents colorComponentsFromColor(SharedColor color) {
  int numberOfComponents = CGColorGetNumberOfComponents(color.get());
  assert(numberOfComponents == 4);
  const CGFloat *components = CGColorGetComponents(color.get());
  return ColorComponents {
    (float)components[0],
    (float)components[1],
    (float)components[2],
    (float)components[3]
  };
}

} // namespace react
} // namespace facebook
