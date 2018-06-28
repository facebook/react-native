/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/LayoutPrimitives.h>
#include <fabric/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * Unified layout constraints for measuring.
 */
struct LayoutConstraints {
  Size minimumSize {0, 0};
  Size maximumSize {kFloatUndefined, kFloatUndefined};
  LayoutDirection layoutDirection;
};

} // namespace react
} // namespace facebook
