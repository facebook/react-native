/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewTransitionModule.h"

#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/RawProps.h>
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

  auto layoutMetrics = captureLayoutMetricsFromRoot(shadowNode);
  if (layoutMetrics == EmptyLayoutMetrics) {
    return;
  }

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

    // TODO: capture bitmap snapshot of old view via platform

    if (auto it = oldPseudoElementNodesForNextTransition_.find(name);
        it != oldPseudoElementNodesForNextTransition_.end()) {
      auto pseudoElementNode = it->second;
      oldPseudoElementNodes_[name] = pseudoElementNode;
      oldPseudoElementNodesForNextTransition_.erase(it);
    }

  } else {
    AnimationKeyFrameView newView{
        .layoutMetrics = keyframeMetrics, .tag = tag, .surfaceId = surfaceId};
    newLayout_[name] = newView;
  }
}

void ViewTransitionModule::createViewTransitionInstance(
    const std::string& name,
    Tag pseudoElementTag) {
  if (uiManager_ == nullptr) {
    return;
  }

  // if createViewTransitionInstance is called before transition started, it
  // creates the old pseudo elements for exiting nodes that potentially
  // participate in current transition that's about to happen; if called after
  // transition started, it creates old pseudo elements for entering nodes, and
  // will be used in next transition when these node are exiting
  bool forNextTransition = false;
  AnimationKeyFrameView view = {};
  auto it = oldLayout_.find(name);
  if (it == oldLayout_.end()) {
    forNextTransition = true;
    if (auto newIt = newLayout_.find(name); newIt != newLayout_.end()) {
      view = newIt->second;
    }
  } else {
    view = it->second;
  }

  // Build props: absolute position matching old element, non-interactive
  if (pseudoElementTag > 0 && view.tag > 0) {
    // Create a base node with layout props via createNode
    // TODO: T262559684 created dedicated shadow node type for old pseudo
    // element
    auto rawProps = RawProps(
        folly::dynamic::object("position", "absolute")(
            "left", view.layoutMetrics.originFromRoot.x)(
            "top", view.layoutMetrics.originFromRoot.y)(
            "width", view.layoutMetrics.size.width)(
            "height", view.layoutMetrics.size.height)("pointerEvents", "none")(
            "opacity", 0)("collapsable", false));

    auto baseNode = uiManager_->createNode(
        pseudoElementTag,
        "View",
        view.surfaceId,
        std::move(rawProps),
        nullptr /* instanceHandle */);

    if (baseNode == nullptr) {
      return;
    }

    // Clone the shadow node — bitmap will be set by platform
    auto pseudoElementNode = baseNode->clone({});

    if (pseudoElementNode != nullptr) {
      if (!forNextTransition) {
        oldPseudoElementNodes_[name] = pseudoElementNode;
      } else {
        oldPseudoElementNodesForNextTransition_[name] = pseudoElementNode;
      }
    }
  }
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

void ViewTransitionModule::applySnapshotsOnPseudoElementShadowNodes() {
  if (oldPseudoElementNodes_.empty() || uiManager_ == nullptr) {
    return;
  }

  // TODO: set bitmap snapshots on pseudo-element views via platform
}

LayoutMetrics ViewTransitionModule::captureLayoutMetricsFromRoot(
    const ShadowNode& shadowNode) {
  if (uiManager_ == nullptr) {
    return EmptyLayoutMetrics;
  }

  // Get the current revision (root node) for this surface
  auto currentRevision =
      uiManager_->getShadowTreeRevisionProvider()->getCurrentRevision(
          shadowNode.getSurfaceId());

  if (currentRevision == nullptr) {
    return EmptyLayoutMetrics;
  }

  // Cast root to LayoutableShadowNode
  auto layoutableRoot =
      dynamic_cast<const LayoutableShadowNode*>(currentRevision.get());
  if (layoutableRoot == nullptr) {
    return EmptyLayoutMetrics;
  }

  return LayoutableShadowNode::computeLayoutMetricsFromRoot(
      shadowNode.getFamily(), *layoutableRoot, {});
}

void ViewTransitionModule::startViewTransition(
    std::function<void()> mutationCallback,
    std::function<void()> onReadyCallback,
    std::function<void()> onCompleteCallback) {
  // Mark transition as started
  transitionStarted_ = true;

  // Call mutation callback (including commitRoot, measureInstance,
  // applyViewTransitionName, createViewTransitionInstance for old & new)
  if (mutationCallback) {
    mutationCallback();
  }

  applySnapshotsOnPseudoElementShadowNodes();

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
  oldPseudoElementNodes_.clear();

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
      auto pseudoElementIt = oldPseudoElementNodes_.find(name);
      auto nativeTag = pseudoElementIt != oldPseudoElementNodes_.end()
          ? pseudoElementIt->second->getTag()
          : view.tag;
      return ViewTransitionInstance{
          .x = view.layoutMetrics.originFromRoot.x,
          .y = view.layoutMetrics.originFromRoot.y,
          .width = view.layoutMetrics.size.width,
          .height = view.layoutMetrics.size.height,
          .nativeTag = nativeTag};
    }
  }

  return std::nullopt;
}

} // namespace facebook::react
