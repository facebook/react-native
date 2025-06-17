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

bool ValueAnimatedNode::setRawValue(double value) noexcept {
  if (value_ != value) {
    value_ = value;

    onValueUpdate();
    return true;
  }
  return false;
}

double ValueAnimatedNode::getRawValue() const noexcept {
  return value_;
}

double ValueAnimatedNode::getOffset() const noexcept {
  return offset_;
}

bool ValueAnimatedNode::setOffset(double offset) noexcept {
  if (offset_ != offset) {
    offset_ = offset;
    return true;
  }
  return true;
}

double ValueAnimatedNode::getValue() const noexcept {
  return value_ + getOffset();
}

void ValueAnimatedNode::flattenOffset() noexcept {
  value_ = value_ + offset_;
  offset_ = 0;
}

void ValueAnimatedNode::extractOffset() noexcept {
  offset_ += value_;
  value_ = 0;
}

void ValueAnimatedNode::onValueUpdate() noexcept {
  if (valueListener_) {
    valueListener_(getValue());
  }
}

void ValueAnimatedNode::setValueListener(
    ValueListenerCallback&& callback) noexcept {
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
