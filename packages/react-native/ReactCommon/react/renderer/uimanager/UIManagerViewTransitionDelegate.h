/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <functional>

namespace facebook::react {

class UIManagerViewTransitionDelegate {
 public:
  virtual ~UIManagerViewTransitionDelegate() = default;

  virtual void applyViewTransitionName(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      const std::string &name,
      const std::string &className)
  {
  }

  virtual void cancelViewTransitionName(const std::shared_ptr<const ShadowNode> &shadowNode, const std::string &name) {}

  virtual void restoreViewTransitionName(const std::shared_ptr<const ShadowNode> &shadowNode) {}

  virtual void captureLayoutMetricsFromRoot(const std::shared_ptr<const ShadowNode> &shadowNode) {}

  virtual void startViewTransition(
      std::function<void()> mutationCallback,
      std::function<void()> onReadyCallback,
      std::function<void()> onCompleteCallback)
  {
  }

  virtual void startViewTransitionEnd() {}
};

} // namespace facebook::react
