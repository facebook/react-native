/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "AdditionAnimatedNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

void AdditionAnimatedNode::update() {
  auto rawValue = 0.0;
  for (const auto tag : inputNodes_) {
    const auto node = manager_->getAnimatedNode<ValueAnimatedNode>(tag);
    react_native_assert(
        node && "Invalid node tag set as input for AdditionAnimatedNode");
    rawValue += node->getValue();
  }
  setRawValue(rawValue);
}

} // namespace facebook::react
