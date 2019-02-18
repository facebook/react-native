// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ShadowTree.h"

#include <react/core/LayoutContext.h>
#include <react/core/LayoutPrimitives.h>
#include <react/debug/SystraceSection.h>
#include <react/mounting/Differentiator.h>
#include <react/mounting/ShadowViewMutation.h>
#include <react/uimanager/TimeUtils.h>

#include "ShadowTreeDelegate.h"

namespace facebook {
namespace react {

static void updateMountedFlag(
    const SharedShadowNodeList &oldChildren,
    const SharedShadowNodeList &newChildren) {
  // This is a simplified version of Diffing algorithm that only updates
  // `mounted` flag on `ShadowNode`s. The algorithm sets "mounted" flag before
  // "unmounted" to allow `ShadowNode` detect a situation where the node was
  // remounted.

  if (&oldChildren == &newChildren) {
    // Lists are identical, nothing to do.
    return;
  }

  if (oldChildren.size() == 0 && newChildren.size() == 0) {
    // Both lists are empty, nothing to do.
    return;
  }

  int index;

  // Stage 1: Mount and unmount "updated" children.
  for (index = 0; index < oldChildren.size() && index < newChildren.size();
       index++) {
    const auto &oldChild = oldChildren[index];
    const auto &newChild = newChildren[index];

    if (oldChild == newChild) {
      // Nodes are identical, skipping the subtree.
      continue;
    }

    if (oldChild->getTag() != newChild->getTag()) {
      // Totally different nodes, updating is impossible.
      break;
    }

    newChild->setMounted(true);
    oldChild->setMounted(false);

    updateMountedFlag(oldChild->getChildren(), newChild->getChildren());
  }

  int lastIndexAfterFirstStage = index;

  // State 2: Mount new children.
  for (index = lastIndexAfterFirstStage; index < newChildren.size(); index++) {
    const auto &newChild = newChildren[index];
    newChild->setMounted(true);
    updateMountedFlag({}, newChild->getChildren());
  }

  // State 3: Unmount old children.
  for (index = lastIndexAfterFirstStage; index < oldChildren.size(); index++) {
    const auto &oldChild = oldChildren[index];
    oldChild->setMounted(false);
    updateMountedFlag(oldChild->getChildren(), {});
  }
}

ShadowTree::ShadowTree(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext)
    : surfaceId_(surfaceId) {
  const auto noopEventEmitter = std::make_shared<const ViewEventEmitter>(
      nullptr, -1, std::shared_ptr<const EventDispatcher>());

  const auto props = std::make_shared<const RootProps>(
      *RootShadowNode::defaultSharedProps(), layoutConstraints, layoutContext);

  rootShadowNode_ = std::make_shared<RootShadowNode>(
      ShadowNodeFragment{
          .tag = surfaceId,
          .rootTag = surfaceId,
          .props = props,
          .eventEmitter = noopEventEmitter,
      },
      nullptr);
}

ShadowTree::~ShadowTree() {
  commit(
      [](const SharedRootShadowNode &oldRootShadowNode) {
        return std::make_shared<RootShadowNode>(
            *oldRootShadowNode,
            ShadowNodeFragment{
                .children = ShadowNode::emptySharedShadowNodeSharedList()});
      },
      getTime());
}

Tag ShadowTree::getSurfaceId() const {
  return surfaceId_;
}

void ShadowTree::commit(
    ShadowTreeCommitTransaction transaction,
    long commitStartTime,
    int *revision) const {
  SystraceSection s("ShadowTree::commit");

  int attempts = 0;

  while (true) {
    attempts++;
    if (tryCommit(transaction, commitStartTime, revision)) {
      return;
    }

    // After multiple attempts, we failed to commit the transaction.
    // Something internally went terribly wrong.
    assert(attempts < 1024);
  }
}

bool ShadowTree::tryCommit(
    ShadowTreeCommitTransaction transaction,
    long commitStartTime,
    int *revision) const {
  SystraceSection s("ShadowTree::tryCommit");

  SharedRootShadowNode oldRootShadowNode;

  {
    // Reading `rootShadowNode_` in shared manner.
    std::shared_lock<folly::SharedMutex> lock(commitMutex_);
    oldRootShadowNode = rootShadowNode_;
  }

  UnsharedRootShadowNode newRootShadowNode = transaction(oldRootShadowNode);

  if (!newRootShadowNode) {
    return false;
  }

  long layoutTime = getTime();
  newRootShadowNode->layout();
  layoutTime = getTime() - layoutTime;
  newRootShadowNode->sealRecursive();

  auto mutations =
      calculateShadowViewMutations(*oldRootShadowNode, *newRootShadowNode);

  {
    // Updating `rootShadowNode_` in unique manner if it hasn't changed.
    std::unique_lock<folly::SharedMutex> lock(commitMutex_);

    if (rootShadowNode_ != oldRootShadowNode) {
      return false;
    }

    rootShadowNode_ = newRootShadowNode;

    {
      std::lock_guard<std::mutex> dispatchLock(EventEmitter::DispatchMutex());

      updateMountedFlag(
          oldRootShadowNode->getChildren(), newRootShadowNode->getChildren());
    }

    revision_++;

    // Returning last revision if requested.
    if (revision) {
      *revision = revision_;
    }
  }

  emitLayoutEvents(mutations);

  if (delegate_) {
    delegate_->shadowTreeDidCommit(
        *this, mutations, commitStartTime, layoutTime);
  }

  return true;
}

void ShadowTree::emitLayoutEvents(
    const ShadowViewMutationList &mutations) const {
  SystraceSection s("ShadowTree::emitLayoutEvents");

  for (const auto &mutation : mutations) {
    // Only `Insert` and `Update` mutations can affect layout metrics.
    if (mutation.type != ShadowViewMutation::Insert &&
        mutation.type != ShadowViewMutation::Update) {
      continue;
    }

    const auto viewEventEmitter =
        std::dynamic_pointer_cast<const ViewEventEmitter>(
            mutation.newChildShadowView.eventEmitter);

    // Checking if particular shadow node supports `onLayout` event (part of
    // `ViewEventEmitter`).
    if (!viewEventEmitter) {
      continue;
    }

    // Checking if the `onLayout` event was requested for the particular Shadow
    // Node.
    const auto viewProps = std::dynamic_pointer_cast<const ViewProps>(
        mutation.newChildShadowView.props);
    if (viewProps && !viewProps->onLayout) {
      continue;
    }

    // In case if we have `oldChildShadowView`, checking that layout metrics
    // have changed.
    if (mutation.type != ShadowViewMutation::Update &&
        mutation.oldChildShadowView.layoutMetrics ==
            mutation.newChildShadowView.layoutMetrics) {
      continue;
    }

    viewEventEmitter->onLayout(mutation.newChildShadowView.layoutMetrics);
  }
}

#pragma mark - Delegate

void ShadowTree::setDelegate(ShadowTreeDelegate const *delegate) {
  delegate_ = delegate;
}

ShadowTreeDelegate const *ShadowTree::getDelegate() const {
  return delegate_;
}

} // namespace react
} // namespace facebook
