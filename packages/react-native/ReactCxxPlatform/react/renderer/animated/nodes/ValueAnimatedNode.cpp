/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "ValueAnimatedNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {
ValueAnimatedNode::ValueAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Value) {
  auto value = 0.0;
  auto offset = 0.0;
  if ((getConfig().count("value") != 0u) &&
      (getConfig().count("offset") != 0u)) {
    value = getConfig()["value"].asDouble();
    offset = getConfig()["offset"].asDouble();
  }

  value_ = value;
  offset_ = offset;
}

bool ValueAnimatedNode::setRawValue(double value) {
  if (value_ != value) {
    value_ = value;

    onValueUpdate();
    return true;
  }
  return false;
}

double ValueAnimatedNode::rawValue() {
  return value_;
}

double ValueAnimatedNode::offset() {
  return offset_;
}

bool ValueAnimatedNode::setOffset(double offset) {
  if (offset_ != offset) {
    offset_ = offset;

    onValueUpdate();
    return true;
  }
  return true;
}

double ValueAnimatedNode::value() {
  return value_ + offset();
}

void ValueAnimatedNode::flattenOffset() {
  setRawValue(value_ + offset());
  setOffset(0.0f);
}

void ValueAnimatedNode::extractOffset() {
  setOffset(value_ + offset());
  setRawValue(0.0f);
}

void ValueAnimatedNode::onValueUpdate() {
  if (valueListener_) {
    valueListener_(value());
  }
}

void ValueAnimatedNode::setValueListener(ValueListenerCallback&& callback) {
  valueListener_ = std::move(callback);
}

OperatorAnimatedNode::OperatorAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : ValueAnimatedNode(tag, config, manager) {
  const auto& input = getConfig()["input"];
  react_native_assert(
      input.type() == folly::dynamic::ARRAY && input.size() >= 2);

  for (const auto& inputNode : input) {
    const auto inputTag = static_cast<Tag>(inputNode.asInt());
    inputNodes_.push_back(inputTag);
  }
}

} // namespace facebook::react
