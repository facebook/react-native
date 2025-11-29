/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include "AnimatedProps.h"

namespace facebook::react {
class AnimatedPropsSerializer {
 public:
  static folly::dynamic packAnimatedProps(const AnimatedProps &animatedProps);
  static void packAnimatedProp(folly::dynamic &dyn, const std::unique_ptr<AnimatedPropBase> &animatedProp);

 private:
  static void packOpacity(folly::dynamic &dyn, const AnimatedPropBase &animatedProp);
  static void packBorderRadii(folly::dynamic &dyn, const AnimatedPropBase &animatedProp);
  static void packTransform(folly::dynamic &dyn, const AnimatedPropBase &animatedProp);
  static void packBackgroundColor(folly::dynamic &dyn, const AnimatedPropBase &animatedProp);
  static void
  packBorderRadiusCorner(folly::dynamic &dyn, const std::string &propName, const std::optional<ValueUnit> &cornerValue);
};
} // namespace facebook::react
