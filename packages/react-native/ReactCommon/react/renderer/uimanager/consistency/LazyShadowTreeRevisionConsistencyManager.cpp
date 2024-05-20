/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LazyShadowTreeRevisionConsistencyManager.h"
#include <glog/logging.h>

namespace facebook::react {

LazyShadowTreeRevisionConsistencyManager::
    LazyShadowTreeRevisionConsistencyManager(
        ShadowTreeRegistry& shadowTreeRegistry)
    : shadowTreeRegistry_(shadowTreeRegistry) {}

void LazyShadowTreeRevisionConsistencyManager::updateCurrentRevision(
    SurfaceId surfaceId,
    RootShadowNode::Shared rootShadowNode) {
  std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);
  capturedRootShadowNodesForConsistency_[surfaceId] = std::move(rootShadowNode);
}

#pragma mark - ShadowTreeRevisionProvider

RootShadowNode::Shared
LazyShadowTreeRevisionConsistencyManager::getCurrentRevision(
    SurfaceId surfaceId) {
  {
    std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);

    auto it = capturedRootShadowNodesForConsistency_.find(surfaceId);
    if (it != capturedRootShadowNodesForConsistency_.end()) {
      return it->second;
    }
  }

  // This method is only going to be called from JS, so we don't need to protect
  // the access to the shadow tree registry as well.
  // If this was multi-threaded, we would need to protect it to avoid capturing
  // root shadow nodes concurrently.
  RootShadowNode::Shared rootShadowNode;
  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    rootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
  });

  {
    std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);
    capturedRootShadowNodesForConsistency_[surfaceId] = rootShadowNode;
  }

  return rootShadowNode;
}

#pragma mark - ConsistentShadowTreeRevisionProvider

void LazyShadowTreeRevisionConsistencyManager::lockRevisions() {
  if (isLocked_) {
    LOG(WARNING)
        << "LazyShadowTreeRevisionConsistencyManager::lockRevisions() called without unlocking a previous lock";
    return;
  }

  // We actually capture the state lazily the first time we access it, so we
  // don't need to do anything here.
  isLocked_ = true;
}

void LazyShadowTreeRevisionConsistencyManager::unlockRevisions() {
  if (!isLocked_) {
    LOG(WARNING)
        << "LazyShadowTreeRevisionConsistencyManager::unlockRevisions() called without a previous lock";
    // We don't return here because we want to do the cleanup anyway
    // to free up resources.
  }

  isLocked_ = false;

  std::unique_lock lock(capturedRootShadowNodesForConsistencyMutex_);
  capturedRootShadowNodesForConsistency_.clear();
}

} // namespace facebook::react
