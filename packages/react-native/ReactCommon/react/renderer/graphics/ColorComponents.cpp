/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ColorComponents.h"
#include <mutex>

namespace facebook::react {

static ColorSpace defaultColorSpace = ColorSpace::sRGB;

ColorSpace getDefaultColorSpace() {
  return defaultColorSpace;
}

void setDefaultColorSpace(ColorSpace newColorSpace) {
  defaultColorSpace = newColorSpace;
}

} // namespace facebook::react
