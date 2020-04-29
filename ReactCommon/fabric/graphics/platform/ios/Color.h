/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <CoreGraphics/CoreGraphics.h>
#include <react/graphics/ColorComponents.h>
#include <react/graphics/Float.h>

namespace facebook {
namespace react {

using Color = CGColor;
using SharedColor = std::shared_ptr<Color>;

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

SharedColor clearColor();
SharedColor blackColor();
SharedColor whiteColor();

} // namespace react
} // namespace facebook
