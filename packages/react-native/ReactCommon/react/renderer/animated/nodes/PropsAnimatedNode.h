/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include "AnimatedNode.h"

#include <react/renderer/animated/internal/primitives.h>
#include <mutex>

namespace facebook::react {
class PropsAnimatedNode final : public AnimatedNode {
 public:
  PropsAnimatedNode(Tag tag, const folly::dynamic &config, NativeAnimatedNodesManager &manager);
  void connectToView(Tag viewTag);
  void disconnectFromView(Tag viewTag);
  void restoreDefaultValues();

  Tag connectedViewTag() const
  {
    return connectedViewTag_;
  }

  folly::dynamic props()
  {
    std::lock_guard<std::mutex> lock(propsMutex_);
    return props_;
  }

  void update() override;

  void update(bool forceFabricCommit);

 private:
  std::mutex propsMutex_;
  folly::dynamic props_;
  bool layoutStyleUpdated_{false};

  Tag connectedViewTag_{animated::undefinedAnimatedNodeIdentifier};
};
} // namespace facebook::react
