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
  size_t operator()(const facebook::react::LayoutConstraints &v) const {
    size_t seed = 0;
    folly::hash::hash_combine(
        seed, std::hash<facebook::react::Size>()(v.minimumSize));
    folly::hash::hash_combine(
        seed, std::hash<facebook::react::Size>()(v.maximumSize));
    folly::hash::hash_combine(seed, v.layoutDirection);
    return hash<int>()(seed);
  }
};
} // namespace std
