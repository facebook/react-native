/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "DiffClampAnimatedNode.h"

#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

DiffClampAnimatedNode::DiffClampAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : ValueAnimatedNode(tag, config, manager),
      inputNodeTag_(static_cast<Tag>(getConfig()["input"].asDouble())),
      min_(getConfig()["min"].asDouble()),
      max_(getConfig()["max"].asDouble()) {}

void DiffClampAnimatedNode::update() {
  if (const auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(inputNodeTag_)) {
    const auto value = node->getValue();
    const auto diff = value - lastValue_;
    lastValue_ = value;
    setRawValue(std::clamp(this->getValue() + diff, min_, max_));
  }
}

} // namespace facebook::react
