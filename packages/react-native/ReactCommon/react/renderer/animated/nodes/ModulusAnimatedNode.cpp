/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "ModulusAnimatedNode.h"

#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

ModulusAnimatedNode::ModulusAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : ValueAnimatedNode(tag, config, manager),
      inputNodeTag_(static_cast<Tag>(getConfig()["input"].asInt())),
      modulus_(getConfig()["modulus"].asDouble()) {}

void ModulusAnimatedNode::update() {
  if (const auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(inputNodeTag_)) {
    setRawValue(std::fmod(node->getValue(), modulus_));
  }
}

} // namespace facebook::react
