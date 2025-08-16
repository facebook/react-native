/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "InterpolationAnimatedNode.h"

#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/animated/internal/primitives.h>
#include <react/renderer/graphics/HostPlatformColor.h>

namespace facebook::react {

InterpolationAnimatedNode::InterpolationAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : ValueAnimatedNode(tag, config, manager) {
  // inputRange example: [0, 1, 10], [1, 1.4, 1.5]
  const auto& nodeConfig = getConfig();
  for (const auto& rangeValue : nodeConfig["inputRange"]) {
    inputRanges_.push_back(rangeValue.asDouble());
  }

  const bool isColorOutput = nodeConfig["outputType"].isString() &&
      nodeConfig["outputType"].asString() == "color";
  if (isColorOutput) {
    isColorValue_ = true;
    for (const auto& rangeValue : nodeConfig["outputRange"]) {
      colorOutputRanges_.push_back(static_cast<int>(rangeValue.asInt()));
    }
  } else {
    for (const auto& rangeValue : nodeConfig["outputRange"]) {
      defaultOutputRanges_.push_back(rangeValue.asDouble());
    }
  }

  extrapolateLeft_ = nodeConfig["extrapolateLeft"].asString();
  extrapolateRight_ = nodeConfig["extrapolateRight"].asString();
}

void InterpolationAnimatedNode::update() {
  if (parentTag_ == animated::undefinedAnimatedNodeIdentifier) {
    return;
  }

  if (const auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(parentTag_)) {
    if (isColorValue_) {
      setRawValue(interpolateColor(node->getValue()));
    } else {
      setRawValue(interpolateValue(node->getValue()));
    }
  }
}

void InterpolationAnimatedNode::onDetachedFromNode(Tag animatedNodeTag) {
  assert(parentTag_ == animatedNodeTag);
  parentTag_ = animated::undefinedAnimatedNodeIdentifier;
}

void InterpolationAnimatedNode::onAttachToNode(Tag animatedNodeTag) {
  assert(!parentTag_);
  parentTag_ = animatedNodeTag;
}

double InterpolationAnimatedNode::interpolateValue(double value) {
  // Compute range index
  int index = 1;
  for (; index < inputRanges_.size() - 1; ++index) {
    if (inputRanges_[index] >= value) {
      break;
    }
  }
  index--;

  return interpolate(
      value,
      inputRanges_[index],
      inputRanges_[index + 1],
      defaultOutputRanges_[index],
      defaultOutputRanges_[index + 1],
      extrapolateLeft_,
      extrapolateRight_);
}

double InterpolationAnimatedNode::interpolateColor(double value) {
  // Compute range index
  int index = 1;
  for (; index < inputRanges_.size() - 1; ++index) {
    if (inputRanges_[index] >= value) {
      break;
    }
  }
  index--;

  const auto outputMin = colorOutputRanges_[index];
  const auto outputMax = colorOutputRanges_[index + 1];
  if (outputMin == outputMax) {
    return outputMin;
  }

  const auto inputMin = inputRanges_[index];
  const auto inputMax = inputRanges_[index + 1];
  if (inputMin == inputMax) {
    if (value <= inputMin) {
      return static_cast<int32_t>(outputMin);
    } else {
      return static_cast<int32_t>(outputMax);
    }
  }

  auto ratio = (value - inputMin) / (inputMax - inputMin);

  auto outputMinA = alphaFromHostPlatformColor(outputMin);
  auto outputMinR = redFromHostPlatformColor(outputMin);
  auto outputMinG = greenFromHostPlatformColor(outputMin);
  auto outputMinB = blueFromHostPlatformColor(outputMin);

  auto outputMaxA = alphaFromHostPlatformColor(outputMax);
  auto outputMaxR = redFromHostPlatformColor(outputMax);
  auto outputMaxG = greenFromHostPlatformColor(outputMax);
  auto outputMaxB = blueFromHostPlatformColor(outputMax);

  auto outputValueA = ratio * (outputMaxA - outputMinA) + outputMinA;
  auto outputValueR = ratio * (outputMaxR - outputMinR) + outputMinR;
  auto outputValueG = ratio * (outputMaxG - outputMinG) + outputMinG;
  auto outputValueB = ratio * (outputMaxB - outputMinB) + outputMinB;

  return static_cast<int32_t>(hostPlatformColorFromRGBA(
      static_cast<uint8_t>(outputValueR),
      static_cast<uint8_t>(outputValueG),
      static_cast<uint8_t>(outputValueB),
      static_cast<uint8_t>(outputValueA)));
}

} // namespace facebook::react
