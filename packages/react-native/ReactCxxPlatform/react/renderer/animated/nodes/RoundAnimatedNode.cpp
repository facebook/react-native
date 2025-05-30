/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "RoundAnimatedNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

RoundAnimatedNode::RoundAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : ValueAnimatedNode(tag, config, manager),
      inputNodeTag_(static_cast<Tag>(getConfig()["input"].asInt())),
      nearest_(getConfig()["input"].asDouble()) {
  react_native_assert(
      nearest_ != 0 &&
      "'nearest' cannot be 0 (can't round to the nearest multiple of 0)");
}

void RoundAnimatedNode::update() {
  auto node = manager_->getAnimatedNode<ValueAnimatedNode>(inputNodeTag_);
  react_native_assert(
      node && "Illegal node ID set as an input for Animated.round node");
  setRawValue(round(node->getValue() / nearest_) * nearest_);
}

} // namespace facebook::react
