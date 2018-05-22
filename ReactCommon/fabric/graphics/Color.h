/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <CoreGraphics/CoreGraphics.h>
#include <memory>

namespace facebook {
namespace react {

using Color = CGColor;
using SharedColor = std::shared_ptr<Color>;

struct ColorComponents {
  float red {0};
  float green {0};
  float blue {0};
  float alpha {0};
};

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

} // namespace react
} // namespace facebook
