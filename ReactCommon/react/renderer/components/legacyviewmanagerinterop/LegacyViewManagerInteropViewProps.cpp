/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropViewProps.h"

namespace facebook {
namespace react {

static folly::dynamic recursiveMerge(
    folly::dynamic const &lhs,
    folly::dynamic const &rhs) {
  auto copy = lhs;
  copy.merge_patch(rhs);
  return copy;
}

LegacyViewManagerInteropViewProps::LegacyViewManagerInteropViewProps(
    const LegacyViewManagerInteropViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      otherProps(
          recursiveMerge(sourceProps.otherProps, (folly::dynamic)rawProps)) {}

} // namespace react
} // namespace facebook
