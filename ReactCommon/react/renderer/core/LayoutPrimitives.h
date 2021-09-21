/*
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
 * Defines visibility of the shadow node and particular layout
 * engine which should be used for laying out the node.
 */
enum class DisplayType {
  None = 0,
  Flex = 1,
  Inline = 2,
};

/*
 * User interface layout direction.
 */
enum class LayoutDirection {
  Undefined = 0,
  LeftToRight = 1,
  RightToLeft = 2,
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

template <>
struct hash<facebook::react::DisplayType> {
  size_t operator()(const facebook::react::DisplayType &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

} // namespace std
