/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "ColorAnimatedNode.h"
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

namespace {

uint8_t getColorValue(
    const NativeAnimatedNodesManager& manager,
    Tag nodeTag,
    bool isDecimal = false) {
  if (const auto node = manager.getAnimatedNode<ValueAnimatedNode>(nodeTag)) {
    if (isDecimal) {
      return std::clamp(
          static_cast<uint32_t>(node->getValue() * 255), 0u, 255u);
    } else {
      return std::clamp(static_cast<uint32_t>(node->getValue()), 0u, 255u);
    }
  }
  return 0;
}

uint8_t getAlphaValue(const NativeAnimatedNodesManager& manager, Tag nodeTag) {
  return getColorValue(manager, nodeTag, true);
}

} // namespace

ColorAnimatedNode::ColorAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Color),
      rNodeTag_(static_cast<Tag>(getConfig()["r"].asInt())),
      gNodeTag_(static_cast<Tag>(getConfig()["g"].asInt())),
      bNodeTag_(static_cast<Tag>(getConfig()["b"].asInt())),
      aNodeTag_(static_cast<Tag>(getConfig()["a"].asInt())) {}

void ColorAnimatedNode::update() {
  color_ = *colorFromRGBA(
      getColorValue(*manager_, rNodeTag_),
      getColorValue(*manager_, gNodeTag_),
      getColorValue(*manager_, bNodeTag_),
      getAlphaValue(*manager_, aNodeTag_));
}

Color ColorAnimatedNode::getColor() {
  if (manager_->updatedNodeTags_.contains(tag_)) {
    update();
    manager_->updatedNodeTags_.erase(tag_);
  }
  return color_;
  return 0;
}

} // namespace facebook::react
