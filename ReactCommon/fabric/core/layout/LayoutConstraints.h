/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/LayoutPrimitives.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * Unified layout constraints for measuring.
 */
struct LayoutConstraints {
  Size minimumSize{0, 0};
  Size maximumSize{kFloatUndefined, kFloatUndefined};
  LayoutDirection layoutDirection{LayoutDirection::Undefined};
};

} // namespace react
} // namespace facebook
