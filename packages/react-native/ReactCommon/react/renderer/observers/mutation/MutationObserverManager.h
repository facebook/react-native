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
      UIManager const &uiManager);

  void unobserve(
      MutationObserverId mutationObserverId,
      ShadowNode const &shadowNode);

  void connect(
      UIManager &uiManager,
      std::function<void(std::vector<const MutationRecord> &)> onMutations);

  void disconnect(UIManager &uiManager);

#pragma mark - UIManagerCommitHook

  void commitHookWasRegistered(UIManager const &uiManager) noexcept override;
  void commitHookWasUnregistered(UIManager const &uiManager) noexcept override;

  RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode) noexcept override;

 private:
  std::unordered_map<
      SurfaceId,
      std::unordered_map<MutationObserverId, MutationObserver>>
      observersBySurfaceId_;

  std::function<void(std::vector<const MutationRecord> &)> onMutations_;
  bool commitHookRegistered_{};

  void runMutationObservations(
      ShadowTree const &shadowTree,
      RootShadowNode const &oldRootShadowNode,
      RootShadowNode const &newRootShadowNode);
};

} // namespace facebook::react
