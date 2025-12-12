/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "ObjectAnimatedNode.h"

#include <glog/logging.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/internal/NativeAnimatedAllowlist.h>
#include <react/renderer/animated/nodes/ColorAnimatedNode.h>
#include <react/renderer/animated/nodes/TransformAnimatedNode.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

ObjectAnimatedNode::ObjectAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Object) {}

void ObjectAnimatedNode::collectViewUpdates(
    std::string propKey,
    folly::dynamic& props) {
  const auto& value = getConfig()["value"];
  switch (value.type()) {
    case folly::dynamic::OBJECT: {
      props.insert(propKey, collectViewUpdatesObjectHelper(value));
    } break;
    case folly::dynamic::ARRAY: {
      props.insert(propKey, collectViewUpdatesArrayHelper(value));
    } break;
    default: {
      LOG(ERROR) << "Invalid value type for ObjectAnimatedNode";
    } break;
  }
}

folly::dynamic ObjectAnimatedNode::collectViewUpdatesObjectHelper(
    const folly::dynamic& value) const {
  folly::dynamic result = folly::dynamic::object();
  for (const auto& valueProp : value.items()) {
    result.insert(valueProp.first.asString(), getValueProp(valueProp.second));
  }
  return result;
}

folly::dynamic ObjectAnimatedNode::collectViewUpdatesArrayHelper(
    const folly::dynamic& value) const {
  folly::dynamic result = folly::dynamic::array();
  for (const auto& valueProp : value) {
    result.push_back(getValueProp(valueProp));
  }
  return result;
}

folly::dynamic ObjectAnimatedNode::getValueProp(
    const folly::dynamic& prop) const {
  switch (prop.type()) {
    case folly::dynamic::OBJECT: {
      if (auto itNodeTag = prop.find("nodeTag");
          itNodeTag != prop.items().end()) {
        auto nodeTag = static_cast<Tag>(itNodeTag->second.asInt());
        if (auto node = manager_->getAnimatedNode<AnimatedNode>(nodeTag)) {
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
              if (const auto valueNode =
                      manager_->getAnimatedNode<ValueAnimatedNode>(nodeTag)) {
                if (valueNode->getIsColorValue()) {
                  return static_cast<int32_t>(valueNode->getValue());
                } else {
                  return valueNode->getValue();
                }
              }
            } break;
            case AnimatedNodeType::Color: {
              if (const auto colorAnimNode =
                      manager_->getAnimatedNode<ColorAnimatedNode>(nodeTag)) {
                return static_cast<int32_t>(colorAnimNode->getColor());
              }
            } break;
            default:
              break;
          }
        }
      } else {
        return collectViewUpdatesObjectHelper(prop);
      }
    } break;
    case folly::dynamic::ARRAY: {
      return collectViewUpdatesArrayHelper(prop);
    };
    case folly::dynamic::NULLT:
    case folly::dynamic::BOOL:
    case folly::dynamic::DOUBLE:
    case folly::dynamic::INT64:
    case folly::dynamic::STRING: {
      return prop;
    };
  }
  LOG(ERROR) << "Invalid prop type for ObjectAnimatedNode";
  return nullptr;
}

} // namespace facebook::react
