/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

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

namespace std {
template <>
struct hash<facebook::react::LayoutDirection> {
  size_t operator()(const facebook::react::LayoutDirection &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};
} // namespace std
