/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include "ValueAnimatedNode.h"

#include <react/renderer/animated/internal/primitives.h>
#include <react/renderer/graphics/Color.h>

namespace facebook::react {

class InterpolationAnimatedNode final : public ValueAnimatedNode {
 public:
  InterpolationAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

  void update() override;
  void onDetachedFromNode(Tag animatedNodeTag) override;
  void onAttachToNode(Tag animatedNodeTag) override;

 private:
  double interpolateValue(double value);
  double interpolateColor(double value);

  std::vector<double> inputRanges_;
  std::vector<double> defaultOutputRanges_;
  std::vector<Color> colorOutputRanges_;
  std::string extrapolateLeft_;
  std::string extrapolateRight_;

  Tag parentTag_{animated::undefinedAnimatedNodeIdentifier};
};
} // namespace facebook::react
