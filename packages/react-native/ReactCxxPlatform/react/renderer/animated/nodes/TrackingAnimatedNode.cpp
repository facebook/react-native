/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "TrackingAnimatedNode.h"

#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

TrackingAnimatedNode::TrackingAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    const std::shared_ptr<NativeAnimatedNodesManager>& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Tracking),
      animationId_(static_cast<int>(getConfig()["animationId"].asInt())),
      toValueNodeId_(static_cast<Tag>(getConfig()["toValue"].asInt())),
      valueNodeId_(static_cast<Tag>(getConfig()["value"].asInt())) {}

void TrackingAnimatedNode::update() {
  if (const auto manager = manager_.lock()) {
    if (const auto toValueNode =
            manager->getAnimatedNode<ValueAnimatedNode>(toValueNodeId_)) {
      // In case the animation is already running, we need to stop it to free up
      // the animationId key in the active animations map in the animation
      // manager.
      manager->stopAnimation(animationId_, true);
      auto animationConfig = getConfig()["animationConfig"];
      animationConfig["toValue"] = toValueNode->value();

      manager->startAnimatingNode(
          animationId_, valueNodeId_, animationConfig, std::nullopt);
    }
  }
};

} // namespace facebook::react
