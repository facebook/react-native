/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/graphics/Float.h>
#include <react/graphics/Point.h>
#include <react/graphics/Rect.h>
#include <react/graphics/RectangleCorners.h>
#include <react/graphics/RectangleEdges.h>
#include <react/graphics/Size.h>

namespace facebook {
namespace react {

struct Vector {
  Float x{0};
  Float y{0};
  Float z{0};
  Float w{0};
};

} // namespace react
} // namespace facebook
