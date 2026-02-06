/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MutationObserverManager.h"
#include <cxxreact/TraceSection.h>
#include <utility>
#include "MutationObserver.h"

namespace facebook::react {

MutationObserverManager::MutationObserverManager() = default;

void MutationObserverManager::observe(
    MutationObserverId mutationObserverId,
    std::shared_ptr<const ShadowNode> shadowNode,
    bool observeSubtree,
    const UIManager& /*uiManager*/) {
  TraceSection s("MutationObserverManager::observe");

  auto surfaceId = shadowNode->getSurfaceId();
  auto shadowNodeFamily = shadowNode->getFamilyShared();

  auto& observers = observersBySurfaceId_[surfaceId];

  auto observerIt = observers.find(mutationObserverId);
  if (observerIt == observers.end()) {
    auto observer = MutationObserver{mutationObserverId};
    observer.observe(shadowNodeFamily, observeSubtree);
    observers.emplace(mutationObserverId, std::move(observer));
  } else {
    auto& observer = observerIt->second;
    observer.observe(shadowNodeFamily, observeSubtree);
  }
}

void MutationObserverManager::unobserveAll(
    MutationObserverId mutationObserverId) {
  TraceSection s("MutationObserverManager::unobserveAll");

  for (auto it = observersBySurfaceId_.begin();
       it != observersBySurfaceId_.end();) {
    auto& observers = it->second;
    auto deleted = observers.erase(mutationObserverId);
    if (deleted > 0 && observers.empty()) {
      it = observersBySurfaceId_.erase(it);
    } else {
      ++it;
    }
  }
}

void MutationObserverManager::connect(
    UIManager& uiManager,
    OnMutations&& onMutations) {
  TraceSection s("MutationObserverManager::connect");

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (commitHookRegistered_) {
    return;
  }

  onMutations_ = std::move(onMutations);

  uiManager.registerCommitHook(*this);
  commitHookRegistered_ = true;
}

void MutationObserverManager::disconnect(UIManager& uiManager) {
  TraceSection s("MutationObserverManager::disconnect");

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (!commitHookRegistered_) {
    return;
  }

  uiManager.unregisterCommitHook(*this);

  onMutations_ = nullptr;
  commitHookRegistered_ = false;
}

void MutationObserverManager::commitHookWasRegistered(
    const UIManager& uiManager) noexcept {}
void MutationObserverManager::commitHookWasUnregistered(
    const UIManager& uiManager) noexcept {}

RootShadowNode::Unshared MutationObserverManager::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& oldRootShadowNode,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTree::CommitOptions& commitOptions) noexcept {
  if (commitOptions.source == ShadowTree::CommitSource::React) {
    runMutationObservations(shadowTree, *oldRootShadowNode, *newRootShadowNode);
  }
  return newRootShadowNode;
}

void MutationObserverManager::runMutationObservations(
    const ShadowTree& shadowTree,
    const RootShadowNode& oldRootShadowNode,
    const RootShadowNode& newRootShadowNode) {
  TraceSection s("MutationObserverManager::runMutationObservations");

  auto surfaceId = shadowTree.getSurfaceId();

  auto observersIt = observersBySurfaceId_.find(surfaceId);
  if (observersIt == observersBySurfaceId_.end()) {
    return;
  }

  std::vector<MutationRecord> mutationRecords;

  auto& observers = observersIt->second;
  for (const auto& [mutationObserverId, observer] : observers) {
    observer.recordMutations(
        oldRootShadowNode, newRootShadowNode, mutationRecords);
  }

  if (!mutationRecords.empty()) {
    onMutations_(mutationRecords);
  }
}

} // namespace facebook::react
