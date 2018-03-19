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
 * Describes results of layout process for partucular shadow node.
 */
struct LayoutMetrics {
  Rect frame;
  EdgeInsets contentInsets {0};
  EdgeInsets borderWidth {0};
  DisplayType displayType {Flex};
  LayoutDirection layoutDirection {Undefined};
};

} // namespace react
} // namespace facebook
