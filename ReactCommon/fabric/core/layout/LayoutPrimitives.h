/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace react {

/*
 * Defines visibility of the shadow node and partucular layout
 * engine which should be used for laying out the node.
 */
enum class DisplayType {
  None,
  Flex,
  Inline,
};

/*
 * User interface layout direction.
 */
enum class LayoutDirection {
  Undefined,
  LeftToRight,
  RightToLeft,
};

} // namespace react
} // namespace facebook
