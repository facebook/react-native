/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <vector>
#include "MutationObserver.h"

namespace facebook::react {

class MutationObserverManager final : public UIManagerCommitHook {
 public:
  MutationObserverManager();

  void observe(
      MutationObserverId mutationObserverId,
      ShadowNode::Shared shadowNode,
      bool observeSubtree,
      const UIManager& uiManager);

  void unobserve(
      MutationObserverId mutationObserverId,
      const ShadowNode& shadowNode);

  void connect(
      UIManager& uiManager,
      std::function<void(std::vector<MutationRecord>&)> onMutations);

  void disconnect(UIManager& uiManager);

#pragma mark - UIManagerCommitHook

  void commitHookWasRegistered(const UIManager& uiManager) noexcept override;
  void commitHookWasUnregistered(const UIManager& uiManager) noexcept override;

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& shadowTree,
      const RootShadowNode::Shared& oldRootShadowNode,
      const RootShadowNode::Unshared& newRootShadowNode) noexcept override;

 private:
  std::unordered_map<
      SurfaceId,
      std::unordered_map<MutationObserverId, MutationObserver>>
      observersBySurfaceId_;

  std::function<void(std::vector<MutationRecord>&)> onMutations_;
  bool commitHookRegistered_{};

  void runMutationObservations(
      const ShadowTree& shadowTree,
      const RootShadowNode& oldRootShadowNode,
      const RootShadowNode& newRootShadowNode);
};

} // namespace facebook::react
