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
    const std::shared_ptr<NativeAnimatedNodesManager>& manager,
    AnimatedNodeType type)
    : tag_(tag), manager_(manager), type_(type), config_(std::move(config)) {}

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

std::shared_ptr<AnimatedNode> AnimatedNode::getChildNode(Tag tag) {
  if (const auto manager = manager_.lock()) {
    if (children_.find(tag) != children_.end()) {
      return manager->getAnimatedNode<AnimatedNode>(tag);
    }
  }

  return nullptr;
}

std::optional<AnimatedNodeType> AnimatedNode::getNodeTypeByName(
    const std::string& nodeTypeName) {
  static std::unordered_map<std::string, AnimatedNodeType> typeNames = {
      {"style", AnimatedNodeType::Style},
      {"value", AnimatedNodeType::Value},
      {"color", AnimatedNodeType::Color},
      {"props", AnimatedNodeType::Props},
      {"interpolation", AnimatedNodeType::Interpolation},
      {"addition", AnimatedNodeType::Addition},
      {"subtraction", AnimatedNodeType::Subtraction},
      {"division", AnimatedNodeType::Division},
      {"multiplication", AnimatedNodeType::Multiplication},
      {"modulus", AnimatedNodeType::Modulus},
      {"diffclamp", AnimatedNodeType::Diffclamp},
      {"transform", AnimatedNodeType::Transform},
      {"tracking", AnimatedNodeType::Tracking},
      {"round", AnimatedNodeType::Round}};

  if (auto iter = typeNames.find(nodeTypeName); iter != typeNames.end()) {
    return iter->second;
  }
  return std::nullopt;
}

} // namespace facebook::react
