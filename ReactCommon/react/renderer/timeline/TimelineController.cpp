/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimelineController.h"

#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook {
namespace react {

TimelineHandler TimelineController::enable(SurfaceId surfaceId) const {
  assert(uiManager_);

  auto shadowTreePtr = (ShadowTree const *){};

  uiManager_->getShadowTreeRegistry().visit(
      surfaceId,
      [&](ShadowTree const &shadowTree) { shadowTreePtr = &shadowTree; });

  assert(shadowTreePtr);

  {
    std::unique_lock<butter::shared_mutex> lock(timelinesMutex_);

    auto timeline = std::make_unique<Timeline>(*shadowTreePtr);
    auto handler = TimelineHandler{*timeline};
    timelines_.emplace(surfaceId, std::move(timeline));
    return handler;
  }
}

void TimelineController::disable(TimelineHandler &&handler) const {
  std::unique_lock<butter::shared_mutex> lock(timelinesMutex_);

  auto iterator = timelines_.find(handler.getSurfaceId());
  assert(iterator != timelines_.end());
  timelines_.erase(iterator);
  handler.release();
}

void TimelineController::commitHookWasRegistered(
    UIManager const &uiManager) const noexcept {
  uiManager_ = &uiManager;
}

void TimelineController::commitHookWasUnregistered(
    UIManager const &uiManager) const noexcept {
  uiManager_ = nullptr;
}

RootShadowNode::Unshared TimelineController::shadowTreeWillCommit(
    ShadowTree const &shadowTree,
    RootShadowNode::Shared const &oldRootShadowNode,
    RootShadowNode::Unshared const &newRootShadowNode) const noexcept {
  std::shared_lock<butter::shared_mutex> lock(timelinesMutex_);

  assert(uiManager_ && "`uiManager_` must not be `nullptr`.");

  lastUpdatedSurface_ = shadowTree.getSurfaceId();

  auto iterator = timelines_.find(shadowTree.getSurfaceId());
  if (iterator == timelines_.end()) {
    return newRootShadowNode;
  }

  auto &timeline = *iterator->second;
  return timeline.shadowTreeWillCommit(
      shadowTree, oldRootShadowNode, newRootShadowNode);
}

} // namespace react
} // namespace facebook
