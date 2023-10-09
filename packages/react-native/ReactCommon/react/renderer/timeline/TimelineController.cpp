/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimelineController.h"

#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

TimelineHandler TimelineController::enable(SurfaceId surfaceId) const {
  assert(uiManager_);

  const ShadowTree* shadowTreePtr = nullptr;
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId,
      [&](const ShadowTree& shadowTree) { shadowTreePtr = &shadowTree; });

  assert(shadowTreePtr);

  {
    std::unique_lock<std::shared_mutex> lock(timelinesMutex_);

    auto timeline = std::make_unique<Timeline>(*shadowTreePtr);
    auto handler = TimelineHandler{*timeline};
    timelines_.emplace(surfaceId, std::move(timeline));
    return handler;
  }
}

void TimelineController::disable(TimelineHandler&& handler) const {
  std::unique_lock<std::shared_mutex> lock(timelinesMutex_);

  auto iterator = timelines_.find(handler.getSurfaceId());
  assert(iterator != timelines_.end());
  timelines_.erase(iterator);
  handler.release();
}

void TimelineController::commitHookWasRegistered(
    const UIManager& uiManager) noexcept {
  uiManager_ = &uiManager;
}

void TimelineController::commitHookWasUnregistered(
    const UIManager& /*uiManager*/) noexcept {
  uiManager_ = nullptr;
}

RootShadowNode::Unshared TimelineController::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& oldRootShadowNode,
    const RootShadowNode::Unshared& newRootShadowNode) noexcept {
  std::shared_lock<std::shared_mutex> lock(timelinesMutex_);

  assert(uiManager_ && "`uiManager_` must not be `nullptr`.");

  lastUpdatedSurface_ = shadowTree.getSurfaceId();

  auto iterator = timelines_.find(shadowTree.getSurfaceId());
  if (iterator == timelines_.end()) {
    return newRootShadowNode;
  }

  auto& timeline = *iterator->second;
  return timeline.shadowTreeWillCommit(
      shadowTree, oldRootShadowNode, newRootShadowNode);
}

} // namespace facebook::react
