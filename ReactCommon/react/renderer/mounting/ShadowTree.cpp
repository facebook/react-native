/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowTree.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>

#include "ShadowTreeDelegate.h"

namespace facebook {
namespace react {

using CommitStatus = ShadowTree::CommitStatus;
using CommitMode = ShadowTree::CommitMode;

/*
 * Generates (possibly) a new tree where all nodes with non-obsolete `State`
 * objects. If all `State` objects in the tree are not obsolete for the moment
 * of calling, the function returns `nullptr` (as an indication that no
 * additional work is required).
 */
static ShadowNode::Unshared progressState(ShadowNode const &shadowNode) {
  auto isStateChanged = false;
  auto areChildrenChanged = false;

  auto newState = shadowNode.getState();
  if (newState) {
    newState = newState->getMostRecentStateIfObsolete();
    if (newState) {
      isStateChanged = true;
    }
  }

  auto newChildren = ShadowNode::ListOfShared{};
  if (!shadowNode.getChildren().empty()) {
    auto index = size_t{0};
    for (auto const &childNode : shadowNode.getChildren()) {
      auto newChildNode = progressState(*childNode);
      if (newChildNode) {
        if (!areChildrenChanged) {
          // Making a copy before the first mutation.
          newChildren = shadowNode.getChildren();
        }
        newChildren[index] = newChildNode;
        areChildrenChanged = true;
      }
      index++;
    }
  }

  if (!areChildrenChanged && !isStateChanged) {
    return nullptr;
  }

  return shadowNode.clone({
      ShadowNodeFragment::propsPlaceholder(),
      areChildrenChanged ? std::make_shared<ShadowNode::ListOfShared const>(
                               std::move(newChildren))
                         : ShadowNodeFragment::childrenPlaceholder(),
      isStateChanged ? newState : ShadowNodeFragment::statePlaceholder(),
  });
}

/*
 * An optimized version of the previous function (and relies on it).
 * The function uses a given base tree to exclude unchanged (equal) parts
 * of the three from the traversing.
 */
static ShadowNode::Unshared progressState(
    ShadowNode const &shadowNode,
    ShadowNode const &baseShadowNode) {
  // The intuition behind the complexity:
  // - A very few nodes have associated state, therefore it's mostly reading and
  //   it only writes when state objects were found obsolete;
  // - Most before-after trees are aligned, therefore most tree branches will be
  //   skipped;
  // - If trees are significantly different, any other algorithm will have
  //   close to linear complexity.

  auto isStateChanged = false;
  auto areChildrenChanged = false;

  auto newState = shadowNode.getState();
  if (newState) {
    newState = newState->getMostRecentStateIfObsolete();
    if (newState) {
      isStateChanged = true;
    }
  }

  auto &children = shadowNode.getChildren();
  auto &baseChildren = baseShadowNode.getChildren();
  auto newChildren = ShadowNode::ListOfShared{};

  auto childrenSize = children.size();
  auto baseChildrenSize = baseChildren.size();
  auto index = size_t{0};

  // Stage 1: Aligned part.
  for (index = 0; index < childrenSize && index < baseChildrenSize; index++) {
    auto const &childNode = *children[index];
    auto const &baseChildNode = *baseChildren[index];

    if (&childNode == &baseChildNode) {
      // Nodes are identical, skipping.
      continue;
    }

    if (!ShadowNode::sameFamily(childNode, baseChildNode)) {
      // Totally different nodes, updating is impossible.
      break;
    }

    auto newChildNode = progressState(childNode, baseChildNode);
    if (newChildNode) {
      if (!areChildrenChanged) {
        // Making a copy before the first mutation.
        newChildren = children;
      }
      newChildren[index] = newChildNode;
      areChildrenChanged = true;
    }
  }

  // Stage 2: Misaligned part.
  for (; index < childrenSize; index++) {
    auto newChildNode = progressState(*children[index]);
    if (newChildNode) {
      if (!areChildrenChanged) {
        // Making a copy before the first mutation.
        newChildren = children;
      }
      newChildren[index] = newChildNode;
      areChildrenChanged = true;
    }
  }

  if (!areChildrenChanged && !isStateChanged) {
    return nullptr;
  }

  return shadowNode.clone({
      ShadowNodeFragment::propsPlaceholder(),
      areChildrenChanged ? std::make_shared<ShadowNode::ListOfShared const>(
                               std::move(newChildren))
                         : ShadowNodeFragment::childrenPlaceholder(),
      isStateChanged ? newState : ShadowNodeFragment::statePlaceholder(),
  });
}

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

  if (oldChildren.empty() && newChildren.empty()) {
    // Both lists are empty, nothing to do.
    return;
  }

  size_t index;

  // Stage 1: Mount and unmount "updated" children.
  for (index = 0; index < oldChildren.size() && index < newChildren.size();
       index++) {
    const auto &oldChild = oldChildren[index];
    const auto &newChild = newChildren[index];

    if (oldChild == newChild) {
      // Nodes are identical, skipping the subtree.
      continue;
    }

    if (!ShadowNode::sameFamily(*oldChild, *newChild)) {
      // Totally different nodes, updating is impossible.
      break;
    }

    newChild->setMounted(true);
    oldChild->setMounted(false);

    updateMountedFlag(oldChild->getChildren(), newChild->getChildren());
  }

  size_t lastIndexAfterFirstStage = index;

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
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext,
    ShadowTreeDelegate const &delegate,
    ContextContainer const &contextContainer)
    : surfaceId_(surfaceId), delegate_(delegate) {
  const auto noopEventEmitter = std::make_shared<const ViewEventEmitter>(
      nullptr, -1, std::shared_ptr<const EventDispatcher>());

  static auto globalRootComponentDescriptor =
      std::make_unique<RootComponentDescriptor const>(
          ComponentDescriptorParameters{
              EventDispatcher::Shared{}, nullptr, nullptr});

  const auto props = std::make_shared<const RootProps>(
      PropsParserContext{surfaceId, contextContainer},
      *RootShadowNode::defaultSharedProps(),
      layoutConstraints,
      layoutContext);

  auto const fragment =
      ShadowNodeFamilyFragment{surfaceId, surfaceId, noopEventEmitter};
  auto family = globalRootComponentDescriptor->createFamily(fragment, nullptr);

  auto rootShadowNode = std::static_pointer_cast<const RootShadowNode>(
      globalRootComponentDescriptor->createShadowNode(
          ShadowNodeFragment{
              /* .props = */ props,
          },
          family));

  currentRevision_ = ShadowTreeRevision{
      rootShadowNode, INITIAL_REVISION, TransactionTelemetry{}};

  mountingCoordinator_ =
      std::make_shared<MountingCoordinator const>(currentRevision_);
}

ShadowTree::~ShadowTree() {
  mountingCoordinator_->revoke();
}

Tag ShadowTree::getSurfaceId() const {
  return surfaceId_;
}

void ShadowTree::setCommitMode(CommitMode commitMode) const {
  auto revision = ShadowTreeRevision{};

  {
    std::unique_lock<butter::shared_mutex> lock(commitMutex_);
    if (commitMode_ == commitMode) {
      return;
    }

    commitMode_ = commitMode;
    revision = currentRevision_;
  }

  // initial revision never contains any commits so mounting it here is
  // incorrect
  if (commitMode == CommitMode::Normal && revision.number != INITIAL_REVISION) {
    mount(revision);
  }
}

CommitMode ShadowTree::getCommitMode() const {
  std::shared_lock<butter::shared_mutex> lock(commitMutex_);
  return commitMode_;
}

MountingCoordinator::Shared ShadowTree::getMountingCoordinator() const {
  return mountingCoordinator_;
}

CommitStatus ShadowTree::commit(
    ShadowTreeCommitTransaction transaction,
    CommitOptions commitOptions) const {
  SystraceSection s("ShadowTree::commit");

  int attempts = 0;

  while (true) {
    attempts++;

    auto status = tryCommit(transaction, commitOptions);
    if (status != CommitStatus::Failed) {
      return status;
    }

    // After multiple attempts, we failed to commit the transaction.
    // Something internally went terribly wrong.
    react_native_assert(attempts < 1024);
  }
}

CommitStatus ShadowTree::tryCommit(
    ShadowTreeCommitTransaction transaction,
    CommitOptions commitOptions) const {
  SystraceSection s("ShadowTree::tryCommit");

  auto telemetry = TransactionTelemetry{};
  telemetry.willCommit();

  CommitMode commitMode;
  auto oldRevision = ShadowTreeRevision{};
  auto newRevision = ShadowTreeRevision{};

  {
    // Reading `currentRevision_` in shared manner.
    std::shared_lock<butter::shared_mutex> lock(commitMutex_);
    commitMode = commitMode_;
    oldRevision = currentRevision_;
  }

  auto const &oldRootShadowNode = oldRevision.rootShadowNode;
  auto newRootShadowNode = transaction(*oldRevision.rootShadowNode);

  if (!newRootShadowNode ||
      (commitOptions.shouldYield && commitOptions.shouldYield())) {
    return CommitStatus::Cancelled;
  }

  if (commitOptions.enableStateReconciliation) {
    auto updatedNewRootShadowNode =
        progressState(*newRootShadowNode, *oldRootShadowNode);
    if (updatedNewRootShadowNode) {
      newRootShadowNode =
          std::static_pointer_cast<RootShadowNode>(updatedNewRootShadowNode);
    }
  }

  // Layout nodes.
  std::vector<LayoutableShadowNode const *> affectedLayoutableNodes{};
  affectedLayoutableNodes.reserve(1024);

  telemetry.willLayout();
  telemetry.setAsThreadLocal();
  newRootShadowNode->layoutIfNeeded(&affectedLayoutableNodes);
  telemetry.unsetAsThreadLocal();
  telemetry.didLayout();

  // Seal the shadow node so it can no longer be mutated
  newRootShadowNode->sealRecursive();

  {
    // Updating `currentRevision_` in unique manner if it hasn't changed.
    std::unique_lock<butter::shared_mutex> lock(commitMutex_);

    if (currentRevision_.number != oldRevision.number) {
      return CommitStatus::Failed;
    }

    auto newRevisionNumber = oldRevision.number + 1;

    newRootShadowNode = delegate_.shadowTreeWillCommit(
        *this, oldRootShadowNode, newRootShadowNode);

    if (!newRootShadowNode ||
        (commitOptions.shouldYield && commitOptions.shouldYield())) {
      return CommitStatus::Cancelled;
    }

    {
      std::lock_guard<std::mutex> dispatchLock(EventEmitter::DispatchMutex());

      updateMountedFlag(
          currentRevision_.rootShadowNode->getChildren(),
          newRootShadowNode->getChildren());
    }

    telemetry.didCommit();
    telemetry.setRevisionNumber(static_cast<int>(newRevisionNumber));

    newRevision =
        ShadowTreeRevision{newRootShadowNode, newRevisionNumber, telemetry};

    currentRevision_ = newRevision;
  }

  emitLayoutEvents(affectedLayoutableNodes);

  if (commitMode == CommitMode::Normal) {
    mount(newRevision);
  }

  return CommitStatus::Succeeded;
}

ShadowTreeRevision ShadowTree::getCurrentRevision() const {
  std::shared_lock<butter::shared_mutex> lock(commitMutex_);
  return currentRevision_;
}

void ShadowTree::mount(ShadowTreeRevision const &revision) const {
  mountingCoordinator_->push(revision);
  delegate_.shadowTreeDidFinishTransaction(*this, mountingCoordinator_);
}

void ShadowTree::commitEmptyTree() const {
  commit(
      [](RootShadowNode const &oldRootShadowNode) -> RootShadowNode::Unshared {
        return std::make_shared<RootShadowNode>(
            oldRootShadowNode,
            ShadowNodeFragment{
                /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
            });
      });
}

void ShadowTree::emitLayoutEvents(
    std::vector<LayoutableShadowNode const *> &affectedLayoutableNodes) const {
  SystraceSection s("ShadowTree::emitLayoutEvents");

  for (auto const *layoutableNode : affectedLayoutableNodes) {
    // Only instances of `ViewShadowNode` (and subclasses) are supported.
    auto const &viewShadowNode =
        static_cast<ViewShadowNode const &>(*layoutableNode);
    auto const &viewEventEmitter = static_cast<ViewEventEmitter const &>(
        *viewShadowNode.getEventEmitter());

    // Checking if the `onLayout` event was requested for the particular Shadow
    // Node.
    auto const &viewProps =
        static_cast<ViewProps const &>(*viewShadowNode.getProps());
    if (!viewProps.onLayout) {
      continue;
    }

    viewEventEmitter.onLayout(layoutableNode->getLayoutMetrics());
  }
}

void ShadowTree::notifyDelegatesOfUpdates() const {
  delegate_.shadowTreeDidFinishTransaction(*this, mountingCoordinator_);
}

} // namespace react
} // namespace facebook
