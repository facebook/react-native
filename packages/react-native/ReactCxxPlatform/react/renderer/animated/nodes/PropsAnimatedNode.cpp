/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "PropsAnimatedNode.h"

#include <react/renderer/animated/NativeAnimatedAllowlist.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/nodes/ColorAnimatedNode.h>
#include <react/renderer/animated/nodes/StyleAnimatedNode.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

namespace {

bool isLayoutStyleUpdated(
    const folly::dynamic& props,
    const std::shared_ptr<NativeAnimatedNodesManager>& manager) {
  for (const auto& entry : props.items()) {
    auto nodeTag = static_cast<Tag>(entry.second.asInt());
    if (const auto& node = manager->getAnimatedNode<AnimatedNode>(nodeTag)) {
      if (node->type() == AnimatedNodeType::Style) {
        if (const auto& styleNode =
                manager->getAnimatedNode<StyleAnimatedNode>(nodeTag)) {
          auto& styleNodeProps = styleNode->getProps();
          for (const auto& styleNodeProp : styleNodeProps.items()) {
            if (getDirectManipulationAllowlist().count(
                    styleNodeProp.first.asString()) == 0u) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

} // namespace

PropsAnimatedNode::PropsAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    const std::shared_ptr<NativeAnimatedNodesManager>& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Props),
      props_(folly::dynamic::object()),
      layoutStyleUpdated_(isLayoutStyleUpdated(getConfig()["props"], manager)) {
}

void PropsAnimatedNode::connectToView(Tag viewTag) {
  if (connectedViewTag_) {
    throw std::invalid_argument(
        "Animated node " + std::to_string(tag_) +
        " has already been attached to a view already exists.");
    return;
  }
  connectedViewTag_ = viewTag;
}

void PropsAnimatedNode::disconnectFromView(Tag viewTag) {
  if (connectedViewTag_ == animated::undefinedAnimatedNodeIdentifier) {
    return;
  } else if (connectedViewTag_ != viewTag) {
    throw std::invalid_argument(
        "Attempting to disconnect view that has not been connected with the given animated node.");
    return;
  }
  connectedViewTag_ = animated::undefinedAnimatedNodeIdentifier;
}

// restore the value to whatever the value was on the ShadowNode instead of in
// the View hierarchy
void PropsAnimatedNode::restoreDefaultValues() {
  // If node is already disconnected from View, we cannot restore default values
  if (connectedViewTag_ != animated::undefinedAnimatedNodeIdentifier) {
    if (const auto manager = manager_.lock()) {
      manager->schedulePropsCommit(
          connectedViewTag_, folly::dynamic::object(), false, false);
    }
  }
}

void PropsAnimatedNode::update() {
  return update(false);
}

void PropsAnimatedNode::update(bool forceFabricCommit) {
  if (connectedViewTag_ == animated::undefinedAnimatedNodeIdentifier) {
    return;
  }

  // TODO: T190192206 consolidate shared update logic between
  // Props/StyleAnimatedNode
  std::lock_guard<std::mutex> lock(propsMutex_);
  if (const auto manager = manager_.lock()) {
    const auto& configProps = getConfig()["props"];
    for (const auto& entry : configProps.items()) {
      auto propName = entry.first.asString();
      auto nodeTag = static_cast<Tag>(entry.second.asInt());
      if (auto node = manager->getAnimatedNode<AnimatedNode>(nodeTag)) {
        switch (node->type()) {
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
            if (const auto& valueNode =
                    manager->getAnimatedNode<ValueAnimatedNode>(nodeTag)) {
              if (valueNode->isColorValue()) {
                props_.insert(
                    propName.c_str(), static_cast<int32_t>(valueNode->value()));
              } else {
                props_.insert(propName.c_str(), valueNode->value());
              }
            }
          } break;
          case AnimatedNodeType::Color: {
            if (const auto& colorNode =
                    manager->getAnimatedNode<ColorAnimatedNode>(nodeTag)) {
              props_.insert(
                  propName.c_str(),
                  static_cast<int32_t>(colorNode->getColor()));
            }
          } break;
          case AnimatedNodeType::Style: {
            if (const auto& styleNode =
                    manager->getAnimatedNode<StyleAnimatedNode>(nodeTag)) {
              styleNode->update();
              auto& styleNodeProps = styleNode->getProps();
              for (const auto& styleNodeProp : styleNodeProps.items()) {
                props_.insert(
                    styleNodeProp.first.c_str(), styleNodeProp.second);
              }
            }
          } break;
          case AnimatedNodeType::Props:
          case AnimatedNodeType::Tracking:
          case AnimatedNodeType::Transform:
            break;
        }
      }
    }

    manager->schedulePropsCommit(
        connectedViewTag_, props_, layoutStyleUpdated_, forceFabricCommit);
  }
}

} // namespace facebook::react
