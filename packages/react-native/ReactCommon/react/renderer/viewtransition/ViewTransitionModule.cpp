/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewTransitionModule.h"

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

ViewTransitionModule::~ViewTransitionModule() {
  if (uiManager_ != nullptr) {
    if (uiManager_->getViewTransitionDelegate() == this) {
      uiManager_->setViewTransitionDelegate(nullptr);
    }
    uiManager_->unregisterCommitHook(*this);
    uiManager_ = nullptr;
  }
}

void ViewTransitionModule::initialize(
    UIManager* uiManager,
    std::weak_ptr<ViewTransitionModule> weakThis) {
  if (uiManager_ != nullptr) {
    uiManager_->unregisterCommitHook(*this);
  }
  uiManager_ = uiManager;
  if (uiManager_ != nullptr) {
    uiManager_->registerCommitHook(*this);

    // Register as MountingOverrideDelegate on existing surfaces
    uiManager_->getShadowTreeRegistry().enumerate(
        [weakThis](const ShadowTree& shadowTree, bool& /*stop*/) {
          shadowTree.getMountingCoordinator()->setMountingOverrideDelegate(
              weakThis);
        });

    // Register on surfaces started in the future
    uiManager_->setOnSurfaceStartCallback(
        [weakThis](const ShadowTree& shadowTree) {
          shadowTree.getMountingCoordinator()->setMountingOverrideDelegate(
              weakThis);
        });

    uiManager_->setViewTransitionDelegate(this);
  }
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

    // Request the platform to capture a bitmap snapshot of the old view
    // while it's still mounted. The platform stores the bitmap keyed by tag.
    if (uiManager_ != nullptr) {
      auto* delegate = uiManager_->getDelegate();
      if (delegate != nullptr) {
        delegate->uiManagerDidCaptureViewSnapshot(tag, surfaceId);
      }
    }

    if (auto it = oldPseudoElementNodesRepository_.find(name);
        it != oldPseudoElementNodesRepository_.end()) {
      oldPseudoElementNodes_[name] = it->second.node;
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
      }
      oldPseudoElementNodesRepository_[name] = InactivePseudoElement{
          .node = pseudoElementNode, .sourceTag = view.tag};
    }
  }
}

RootShadowNode::Unshared ViewTransitionModule::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTreeCommitOptions& /*commitOptions*/) noexcept {
  if (oldPseudoElementNodes_.empty()) {
    return newRootShadowNode;
  }

  auto surfaceId = shadowTree.getSurfaceId();

  // Collect pseudo-element nodes for this surface, skipping any that are
  // already present in the children list (from a previous commit hook run).
  const auto& existingChildren = newRootShadowNode->getChildren();
  std::unordered_set<Tag> existingTags;
  existingTags.reserve(existingChildren.size());
  for (const auto& child : existingChildren) {
    existingTags.insert(child->getTag());
  }

  auto newChildren =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
          existingChildren);
  bool appended = false;
  for (const auto& [name, node] : oldPseudoElementNodes_) {
    if (node->getSurfaceId() == surfaceId &&
        existingTags.find(node->getTag()) == existingTags.end()) {
      newChildren->push_back(node);
      appended = true;
    }
  }

  if (!appended) {
    return newRootShadowNode;
  }

  return std::make_shared<RootShadowNode>(
      *newRootShadowNode,
      ShadowNodeFragment{
          .props = ShadowNodeFragment::propsPlaceholder(),
          .children = newChildren,
      });
}

bool ViewTransitionModule::shouldOverridePullTransaction() const {
  return !oldPseudoElementNodesRepository_.empty();
}

std::optional<MountingTransaction> ViewTransitionModule::pullTransaction(
    SurfaceId surfaceId,
    MountingTransaction::Number number,
    const TransactionTelemetry& telemetry,
    ShadowViewMutationList mutations) const {
  for (const auto& mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Delete) {
      auto tag = mutation.oldChildShadowView.tag;
      for (auto it = oldPseudoElementNodesRepository_.begin();
           it != oldPseudoElementNodesRepository_.end();) {
        if (it->second.sourceTag == tag) {
          it = oldPseudoElementNodesRepository_.erase(it);
        } else {
          ++it;
        }
      }
    }
  }
  return MountingTransaction{
      surfaceId, number, std::move(mutations), telemetry};
}

std::shared_ptr<const ShadowNode>
ViewTransitionModule::findPseudoElementShadowNodeByTag(Tag tag) const {
  if (uiManager_ == nullptr) {
    return nullptr;
  }

  auto shadowNode = std::shared_ptr<const ShadowNode>{};

  uiManager_->getShadowTreeRegistry().enumerate(
      [&](const ShadowTree& shadowTree, bool& stop) {
        const auto rootShadowNode =
            shadowTree.getCurrentRevision().rootShadowNode;

        if (rootShadowNode != nullptr) {
          const auto& children = rootShadowNode->getChildren();
          // Pseudo element nodes are appended after the first child (the main
          // React tree), so iterate from index 1 onwards.
          for (size_t i = 1; i < children.size(); ++i) {
            if (children[i]->getTag() == tag) {
              shadowNode = children[i];
              stop = true;
              return;
            }
          }
        }
      });

  return shadowNode;
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

  // Set view snapshots — the pseudo-element nodes themselves will be committed
  // through the normal completeRoot flow via getPseudoElementNodes().
  auto* delegate = uiManager_->getDelegate();
  if (delegate != nullptr) {
    for (const auto& [name, node] : oldPseudoElementNodes_) {
      auto layoutIt = oldLayout_.find(name);
      if (layoutIt != oldLayout_.end()) {
        delegate->uiManagerDidSetViewSnapshot(
            layoutIt->second.tag, node->getTag(), node->getSurfaceId());
      }
    }
  }
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
  // If the reconciler signalled suspension and a transition is still active,
  // queue this transition to run after the current one finishes.
  // Only queue if the previous transition is still running; if it already
  // finished, the flag is stale and we should run normally.
  if (suspendNextTransition_ && transitionStarted_) {
    suspendNextTransition_ = false;
    pendingTransitions_.push(
        PendingTransition{
            std::move(mutationCallback),
            std::move(onReadyCallback),
            std::move(onCompleteCallback)});
    return;
  }
  suspendNextTransition_ = false;

  // Mark transition as started
  transitionStarted_ = true;

  // Call mutation callback (including commitRoot, measureInstance,
  // applyViewTransitionName, createViewTransitionInstance for old & new)
  if (mutationCallback) {
    mutationCallback();
  }

  applySnapshotsOnPseudoElementShadowNodes();
  transitionReadyFinished_ = false;
  if (onReadyCallback) {
    onReadyCallback();
  }

  // Transition animation starts

  // Call onComplete callback when transition finishes
  if (onCompleteCallback) {
    onCompleteCallback();
  }
}

void ViewTransitionModule::startViewTransitionReadyFinished() {
  transitionReadyFinished_ = true;
}

void ViewTransitionModule::suspendOnActiveViewTransition() {
  // Signal that the next transition should be suspended until the current
  // one finishes. The actual queueing happens in startViewTransition.
  if (transitionStarted_) {
    // if there's no active transition, suspendOnActiveViewTransition is no-op
    suspendNextTransition_ = true;
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

  // Clear any pending bitmap snapshots that were captured but never consumed.
  if (uiManager_ != nullptr) {
    auto* delegate = uiManager_->getDelegate();
    if (delegate != nullptr) {
      delegate->uiManagerDidClearPendingSnapshots();
    }
  }

  transitionStarted_ = false;

  if (!pendingTransitions_.empty()) {
    auto pendingTransition = pendingTransitions_.front();
    pendingTransitions_.pop();
    startViewTransition(
        std::move(pendingTransition.mutationCallback),
        std::move(pendingTransition.onReadyCallback),
        std::move(pendingTransition.onCompleteCallback));
    // when this transition finishes, it'll call startViewTransitionEnd
    // during its complete callback and pendingTransitions_ will be processed
    // again
  }
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
