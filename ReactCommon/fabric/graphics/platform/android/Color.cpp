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
  return SharedColor(
    ((int)components.alpha & 0xff) << 24 |
    ((int)components.red & 0xff) << 16 |
    ((int)components.green & 0xff) << 8 |
    ((int)components.blue & 0xff)
  );
}

ColorComponents colorComponentsFromColor(SharedColor sharedColor) {
  Color color = *sharedColor;
  return ColorComponents {
    (float)((color >> 16) & 0xff),
    (float)((color >>  8) & 0xff),
    (float)((color      ) & 0xff),
    (float)((color >> 24) & 0xff)
  };
}

} // namespace react
} // namespace facebook
