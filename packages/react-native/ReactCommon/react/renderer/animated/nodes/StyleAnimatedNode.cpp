/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "StyleAnimatedNode.h"

#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/internal/NativeAnimatedAllowlist.h>
#include <react/renderer/animated/nodes/ColorAnimatedNode.h>
#include <react/renderer/animated/nodes/TransformAnimatedNode.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

namespace {

bool isLayoutPropsUpdated(const folly::dynamic& props) {
  for (const auto& styleNodeProp : props.items()) {
    if (getDirectManipulationAllowlist().count(
            styleNodeProp.first.asString()) == 0u) {
      return true;
    }
  }

  return false;
}

} // namespace

StyleAnimatedNode::StyleAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Style) {}

void StyleAnimatedNode::collectViewUpdates(folly::dynamic& props) {
  const auto& style = getConfig()["style"];
  for (const auto& styleProp : style.items()) {
    auto propName = styleProp.first.asString();
    const auto nodeTag = static_cast<Tag>(styleProp.second.asInt());
    if (auto node = manager_->getAnimatedNode<AnimatedNode>(nodeTag)) {
      switch (node->type()) {
        case AnimatedNodeType::Transform: {
          if (const auto transformNode =
                  manager_->getAnimatedNode<TransformAnimatedNode>(nodeTag)) {
            transformNode->collectViewUpdates(props);
          }
        } break;
        case AnimatedNodeType::Value:
        case AnimatedNodeType::Interpolation:
        case AnimatedNodeType::Modulus:
        case AnimatedNodeType::Round:
        case AnimatedNodeType::Diffclamp:
        // Operators
        case AnimatedNodeType::Addition:
        case AnimatedNodeType::Subtraction:
        case AnimatedNodeType::Multiplication:
        case AnimatedNodeType::Division: {
          if (const auto valueNode =
                  manager_->getAnimatedNode<ValueAnimatedNode>(nodeTag)) {
            if (valueNode->getIsColorValue()) {
              props.insert(
                  propName.c_str(),
                  static_cast<int32_t>(valueNode->getValue()));
            } else {
              props.insert(propName.c_str(), valueNode->getValue());
            }
          }
        } break;
        case AnimatedNodeType::Color: {
          if (const auto colorAnimNode =
                  manager_->getAnimatedNode<ColorAnimatedNode>(nodeTag)) {
            props.insert(
                propName.c_str(),
                static_cast<int32_t>(colorAnimNode->getColor()));
          }
        } break;
        case AnimatedNodeType::Tracking:
        case AnimatedNodeType::Style:
        case AnimatedNodeType::Props:
          break;
      }
    }
  }

  layoutStyleUpdated_ = isLayoutPropsUpdated(props);
}

} // namespace facebook::react
