/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <folly/Hash.h>
#include <react/core/LayoutPrimitives.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * Unified layout constraints for measuring.
 */
struct LayoutConstraints {
  Size minimumSize{0, 0};
  Size maximumSize{std::numeric_limits<Float>::infinity(),
                   std::numeric_limits<Float>::infinity()};
  LayoutDirection layoutDirection{LayoutDirection::Undefined};

  /*
   * Clamps the provided `Size` between the `minimumSize` and `maximumSize`
   * bounds of this `LayoutConstraints`.
   */
  Size clamp(const Size &size) const;
};

inline bool operator==(
    const LayoutConstraints &lhs,
    const LayoutConstraints &rhs) {
  return std::tie(lhs.minimumSize, lhs.maximumSize, lhs.layoutDirection) ==
      std::tie(rhs.minimumSize, rhs.maximumSize, rhs.layoutDirection);
}

} // namespace react
} // namespace facebook

namespace std {
template <>
struct hash<facebook::react::LayoutConstraints> {
  size_t operator()(
      const facebook::react::LayoutConstraints &constraints) const {
    return folly::hash::hash_combine(
        0,
        constraints.minimumSize,
        constraints.maximumSize,
        constraints.layoutDirection);
  }
};
} // namespace std
