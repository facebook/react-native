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

#include <folly/dynamic.h>

namespace facebook::react {
class StyleAnimatedNode final : public AnimatedNode {
 public:
  StyleAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);
  void update() override;

  const folly::dynamic& getProps() const noexcept {
    return props_;
  }

  bool isLayoutStyleUpdated() const noexcept {
    return layoutStyleUpdated_;
  }

 private:
  folly::dynamic props_;
  bool layoutStyleUpdated_;
};
} // namespace facebook::react
