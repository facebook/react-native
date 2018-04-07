/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Color.h"
#include <CoreGraphics/CoreGraphics.h>
#include <CoreGraphics/CGColor.h>
#include <cassert>

namespace facebook {
namespace react {

SharedColor colorFromComponents(float red, float green, float blue, float alpha) {
  const CGFloat components[] = {red, green, blue, alpha};
  CGColorRef color = CGColorCreate(
    CGColorSpaceCreateDeviceRGB(),
    components
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
