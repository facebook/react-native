/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "SubtractionAnimatedNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

void SubtractionAnimatedNode::update() {
  auto rawValue = 0.0;
  int count = 0;
  for (const auto& tag : inputNodes_) {
    const auto node = manager_->getAnimatedNode<ValueAnimatedNode>(tag);
    react_native_assert(
        node && "Invalid node tag set as input for SubtractionAnimatedNode");
    if (count == 0) {
      rawValue = node->value();
    } else {
      rawValue -= node->value();
    }

    count++;
  }
  setRawValue(rawValue);
}

} // namespace facebook::react
