/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

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
  Size maximumSize{kFloatUndefined, kFloatUndefined};
  LayoutDirection layoutDirection{LayoutDirection::Undefined};
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
    auto seed = size_t{0};
    folly::hash::hash_combine(
        seed,
        constraints.minimumSize,
        constraints.maximumSize,
        constraints.layoutDirection);
    return seed;
  }
};
} // namespace std
