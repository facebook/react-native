/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewTransitionModule.h"

#include <glog/logging.h>

#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

void ViewTransitionModule::setUIManager(UIManager* uiManager) {
  uiManager_ = uiManager;
}

void ViewTransitionModule::applyViewTransitionName(
    const ShadowNode& shadowNode,
    const std::string& name,
    const std::string& /*className*/) {
  auto tag = shadowNode.getTag();
  auto surfaceId = shadowNode.getSurfaceId();

  // Look up the captured layout metrics for this shadowNode
  auto metricsIt = capturedLayoutMetricsFromRoot_.find(tag);
  if (metricsIt == capturedLayoutMetricsFromRoot_.end()) {
    // No measurement captured yet, nothing to do
    return;
  }

  const auto& layoutMetrics = metricsIt->second;

  // Convert LayoutMetrics to AnimationKeyFrameViewLayoutMetrics
  AnimationKeyFrameViewLayoutMetrics keyframeMetrics{
      .originFromRoot = layoutMetrics.frame.origin,
      .size = layoutMetrics.frame.size,
      .pointScaleFactor = layoutMetrics.pointScaleFactor};

  nameRegistry_[tag].insert(name);

  // If applyViewTransitionName is called after transition started, this is the
  // "new" state (end snapshot). Otherwise, this is the "old" state (start
  // snapshot)
  if (!transitionStarted_) {
    AnimationKeyFrameView oldView{
        .layoutMetrics = keyframeMetrics, .tag = tag, .surfaceId = surfaceId};
    oldLayout_[name] = oldView;
  } else {
    AnimationKeyFrameView newView{
        .layoutMetrics = keyframeMetrics, .tag = tag, .surfaceId = surfaceId};
    newLayout_[name] = newView;
  }

  capturedLayoutMetricsFromRoot_.erase(tag);
}

void ViewTransitionModule::cancelViewTransitionName(
    const ShadowNode& shadowNode,
    const std::string& name) {
  oldLayout_.erase(name);
  newLayout_.erase(name);
  cancelledNameRegistry_[shadowNode.getTag()].insert(name);
}

void ViewTransitionModule::restoreViewTransitionName(
    const ShadowNode& shadowNode) {
  nameRegistry_[shadowNode.getTag()].merge(
      cancelledNameRegistry_[shadowNode.getTag()]);
  cancelledNameRegistry_.erase(shadowNode.getTag());
}

void ViewTransitionModule::captureLayoutMetricsFromRoot(
    const ShadowNode& shadowNode) {
  if (uiManager_ == nullptr) {
    return;
  }

  // Get the current revision (root node) for this surface
  auto currentRevision =
      uiManager_->getShadowTreeRevisionProvider()->getCurrentRevision(
          shadowNode.getSurfaceId());

  if (currentRevision == nullptr) {
    return;
  }

  // Cast root to LayoutableShadowNode
  auto layoutableRoot =
      dynamic_cast<const LayoutableShadowNode*>(currentRevision.get());
  if (layoutableRoot == nullptr) {
    return;
  }

  // Compute layout metrics from root
  auto layoutMetrics = LayoutableShadowNode::computeLayoutMetricsFromRoot(
      shadowNode.getFamily(), *layoutableRoot, {});

  // Store the layout metrics keyed by tag
  capturedLayoutMetricsFromRoot_[shadowNode.getTag()] = layoutMetrics;
}

void ViewTransitionModule::startViewTransition(
    std::function<void()> mutationCallback,
    std::function<void()> onReadyCallback,
    std::function<void()> onCompleteCallback) {
  // Mark transition as started
  transitionStarted_ = true;

  // Call mutation callback (including commitRoot, measureInstance,
  // applyViewTransitionName for old & new)
  if (mutationCallback) {
    mutationCallback();
  }

  // TODO: capture pseudo elements

  if (onReadyCallback) {
    onReadyCallback();
  }

  // Transition animation starts

  // Call onComplete callback when transition finishes
  if (onCompleteCallback) {
    onCompleteCallback();
  }
}

void ViewTransitionModule::startViewTransitionEnd() {
  for (const auto& [tag, names] : nameRegistry_) {
    for (const auto& name : names) {
      oldLayout_.erase(name);
      newLayout_.erase(name);
    }
  }
  nameRegistry_.clear();

  transitionStarted_ = false;
}

std::optional<UIManagerViewTransitionDelegate::ViewTransitionInstance>
ViewTransitionModule::getViewTransitionInstance(
    const std::string& name,
    const std::string& pseudo) {
  // Look up layout based on pseudo type ("old" or "new")
  if (pseudo == "new") {
    auto it = newLayout_.find(name);
    if (it != newLayout_.end()) {
      const auto& view = it->second;
      return ViewTransitionInstance{
          .x = view.layoutMetrics.originFromRoot.x,
          .y = view.layoutMetrics.originFromRoot.y,
          .width = view.layoutMetrics.size.width,
          .height = view.layoutMetrics.size.height,
          .nativeTag = view.tag};
    }
  } else if (pseudo == "old") {
    auto it = oldLayout_.find(name);
    if (it != oldLayout_.end()) {
      const auto& view = it->second;
      return ViewTransitionInstance{
          .x = view.layoutMetrics.originFromRoot.x,
          .y = view.layoutMetrics.originFromRoot.y,
          .width = view.layoutMetrics.size.width,
          .height = view.layoutMetrics.size.height,
          .nativeTag = view.tag};
    }
  }

  return std::nullopt;
}

} // namespace facebook::react
