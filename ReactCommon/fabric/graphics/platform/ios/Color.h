/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/graphics/Float.h>

#include <fabric/graphics/ColorComponents.h>

namespace facebook {
namespace react {

using Color = CGColor;
using SharedColor = std::shared_ptr<Color>;

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

} // namespace react
} // namespace facebook
