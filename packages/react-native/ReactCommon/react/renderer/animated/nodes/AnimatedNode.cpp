/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "AnimatedNode.h"
#include <react/renderer/animated/NativeAnimatedNodesManager.h>

#include <utility>

namespace facebook::react {

AnimatedNode::AnimatedNode(
    Tag tag,
    folly::dynamic config,
    NativeAnimatedNodesManager& manager,
    AnimatedNodeType type)
    : tag_(tag), manager_(&manager), type_(type), config_(std::move(config)) {}

void AnimatedNode::addChild(const Tag animatedNodeTag) {
  children_.insert(animatedNodeTag);
  getChildNode(animatedNodeTag)->onAttachToNode(tag_);
}

void AnimatedNode::removeChild(const Tag tag) {
  if (const auto childNode = getChildNode(tag)) {
    childNode->onDetachedFromNode(tag_);
    children_.erase(tag);
  }
}

AnimatedNode* AnimatedNode::getChildNode(Tag tag) {
  if (children_.find(tag) != children_.end()) {
    return manager_->getAnimatedNode<AnimatedNode>(tag);
  }

  return nullptr;
}

std::optional<AnimatedNodeType> AnimatedNode::getNodeTypeByName(
    const std::string& nodeTypeName) {
  if (nodeTypeName == "style") {
    return AnimatedNodeType::Style;
  } else if (nodeTypeName == "value") {
    return AnimatedNodeType::Value;
  } else if (nodeTypeName == "color") {
    return AnimatedNodeType::Color;
  } else if (nodeTypeName == "props") {
    return AnimatedNodeType::Props;
  } else if (nodeTypeName == "interpolation") {
    return AnimatedNodeType::Interpolation;
  } else if (nodeTypeName == "addition") {
    return AnimatedNodeType::Addition;
  } else if (nodeTypeName == "subtraction") {
    return AnimatedNodeType::Subtraction;
  } else if (nodeTypeName == "division") {
    return AnimatedNodeType::Division;
  } else if (nodeTypeName == "multiplication") {
    return AnimatedNodeType::Multiplication;
  } else if (nodeTypeName == "modulus") {
    return AnimatedNodeType::Modulus;
  } else if (nodeTypeName == "diffclamp") {
    return AnimatedNodeType::Diffclamp;
  } else if (nodeTypeName == "transform") {
    return AnimatedNodeType::Transform;
  } else if (nodeTypeName == "tracking") {
    return AnimatedNodeType::Tracking;
  } else if (nodeTypeName == "round") {
    return AnimatedNodeType::Round;
  } else if (nodeTypeName == "object") {
    return AnimatedNodeType::Object;
  } else {
    return std::nullopt;
  }
}

} // namespace facebook::react
