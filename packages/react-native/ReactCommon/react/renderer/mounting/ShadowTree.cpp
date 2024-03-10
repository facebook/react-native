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
#include <react/utils/CoreFeatures.h>

#include "ShadowTreeDelegate.h"

namespace facebook::react {

using CommitStatus = ShadowTree::CommitStatus;
using CommitMode = ShadowTree::CommitMode;

// --- Clone-less progress state algorithm ---
// Note: Ideally, we don't have to const_cast but our use of constness in
// C++ is overly restrictive. We do const_cast here but the only place where
// we change ShadowNode is by calling `ShadowNode::progressStateIfNecessary`
// where checks are in place to avoid manipulating a sealed ShadowNode.

static void progressStateIfNecessary(ShadowNode& newShadowNode) {
  newShadowNode.progressStateIfNecessary();

  for (const auto& childNode : newShadowNode.getChildren()) {
    progressStateIfNecessary(const_cast<ShadowNode&>(*childNode));
  }
}

static void progressStateIfNecessary(
    ShadowNode& newShadowNode,
    const ShadowNode& baseShadowNode) {
  newShadowNode.progressStateIfNecessary();

  auto& newChildren = newShadowNode.getChildren();
  auto& baseChildren = baseShadowNode.getChildren();

  auto newChildrenSize = newChildren.size();
  auto baseChildrenSize = baseChildren.size();
  auto index = size_t{0};

  for (index = 0; index < newChildrenSize && index < baseChildrenSize;
       ++index) {
    const auto& newChildNode = *newChildren[index];
    const auto& baseChildNode = *baseChildren[index];

    if (&newChildNode == &baseChildNode) {
      // Nodes are identical. They are shared between `newShadowNode` and
      // `baseShadowNode` and it is safe to skipping.
      continue;
    }

    if (!ShadowNode::sameFamily(newChildNode, baseChildNode)) {
      // The nodes are not of the same family. Tree hierarchy has changed
      // and we have to fall back to full sub-tree traversal from this point on.
      break;
    }

    progressStateIfNecessary(
        const_cast<ShadowNode&>(newChildNode), baseChildNode);
  }

  for (; index < newChildrenSize; ++index) {
    const auto& newChildNode = *newChildren[index];
    progressStateIfNecessary(const_cast<ShadowNode&>(newChildNode));
  }
}
// --- End of Clone-less progress state algorithm ---

/*
 * Generates (possibly) a new tree where all nodes with non-obsolete `State`
 * objects. If all `State` objects in the tree are not obsolete for the moment
 * of calling, the function returns `nullptr` (as an indication that no
 * additional work is required).
 */
static ShadowNode::Unshared progressState(const ShadowNode& shadowNode) {
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
    for (const auto& childNode : shadowNode.getChildren()) {
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
    const ShadowNode& shadowNode,
    const ShadowNode& baseShadowNode) {
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

  auto& children = shadowNode.getChildren();
  auto& baseChildren = baseShadowNode.getChildren();
  auto newChildren = ShadowNode::ListOfShared{};

  auto childrenSize = children.size();
  auto baseChildrenSize = baseChildren.size();
  auto index = size_t{0};

  // Stage 1: Aligned part.
  for (index = 0; index < childrenSize && index < baseChildrenSize; index++) {
    const auto& childNode = *children[index];
    const auto& baseChildNode = *baseChildren[index];

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
    const ShadowNode::ListOfShared& oldChildren,
    const ShadowNode::ListOfShared& newChildren) {
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
    const auto& oldChild = oldChildren[index];
    const auto& newChild = newChildren[index];

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
    const auto& newChild = newChildren[index];
    newChild->setMounted(true);
    updateMountedFlag({}, newChild->getChildren());
  }

  // State 3: Unmount old children.
  for (index = lastIndexAfterFirstStage; index < oldChildren.size(); index++) {
    const auto& oldChild = oldChildren[index];
    oldChild->setMounted(false);
    updateMountedFlag(oldChild->getChildren(), {});
  }
}

ShadowTree::ShadowTree(
    SurfaceId surfaceId,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext,
    const ShadowTreeDelegate& delegate,
    const ContextContainer& contextContainer)
    : surfaceId_(surfaceId), delegate_(delegate) {
  static auto globalRootComponentDescriptor =
      std::make_unique<const RootComponentDescriptor>(
          ComponentDescriptorParameters{
              EventDispatcher::Shared{}, nullptr, nullptr});

  const auto props = std::make_shared<const RootProps>(
      PropsParserContext{surfaceId, contextContainer},
      *RootShadowNode::defaultSharedProps(),
      layoutConstraints,
      layoutContext);

  auto family = globalRootComponentDescriptor->createFamily(
      {surfaceId, surfaceId, nullptr});

  auto rootShadowNode = std::static_pointer_cast<const RootShadowNode>(
      globalRootComponentDescriptor->createShadowNode(
          ShadowNodeFragment{
              /* .props = */ props,
          },
          family));

  currentRevision_ = ShadowTreeRevision{
      rootShadowNode, INITIAL_REVISION, TransactionTelemetry{}};

  lastRevisionNumberWithNewState_ = currentRevision_.number;

  mountingCoordinator_ =
      std::make_shared<const MountingCoordinator>(currentRevision_);
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
    std::unique_lock lock(commitMutex_);
    if (commitMode_ == commitMode) {
      return;
    }

    commitMode_ = commitMode;
    revision = currentRevision_;
  }

  // initial revision never contains any commits so mounting it here is
  // incorrect
  if (commitMode == CommitMode::Normal && revision.number != INITIAL_REVISION) {
    mount(revision, true);
  }
}

CommitMode ShadowTree::getCommitMode() const {
  std::shared_lock lock(commitMutex_);
  return commitMode_;
}

MountingCoordinator::Shared ShadowTree::getMountingCoordinator() const {
  return mountingCoordinator_;
}

CommitStatus ShadowTree::commit(
    const ShadowTreeCommitTransaction& transaction,
    const CommitOptions& commitOptions) const {
  SystraceSection s("ShadowTree::commit");

  [[maybe_unused]] int attempts = 0;

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
    const ShadowTreeCommitTransaction& transaction,
    const CommitOptions& commitOptions) const {
  SystraceSection s("ShadowTree::tryCommit");

  auto telemetry = TransactionTelemetry{};
  telemetry.willCommit();

  CommitMode commitMode;
  auto oldRevision = ShadowTreeRevision{};
  auto newRevision = ShadowTreeRevision{};
  ShadowTreeRevision::Number lastRevisionNumberWithNewState;

  {
    // Reading `currentRevision_` in shared manner.
    std::shared_lock lock(commitMutex_);
    commitMode = commitMode_;
    oldRevision = currentRevision_;
    lastRevisionNumberWithNewState = lastRevisionNumberWithNewState_;
  }

  const auto& oldRootShadowNode = oldRevision.rootShadowNode;
  auto newRootShadowNode = transaction(*oldRevision.rootShadowNode);

  if (!newRootShadowNode ||
      (commitOptions.shouldYield && commitOptions.shouldYield())) {
    return CommitStatus::Cancelled;
  }

  if (commitOptions.enableStateReconciliation) {
    if (CoreFeatures::enableClonelessStateProgression) {
      progressStateIfNecessary(*newRootShadowNode, *oldRootShadowNode);
    } else {
      auto updatedNewRootShadowNode =
          progressState(*newRootShadowNode, *oldRootShadowNode);
      if (updatedNewRootShadowNode) {
        newRootShadowNode =
            std::static_pointer_cast<RootShadowNode>(updatedNewRootShadowNode);
      }
    }
  }

  // Run commit hooks.
  newRootShadowNode = delegate_.shadowTreeWillCommit(
      *this, oldRootShadowNode, newRootShadowNode);

  if (!newRootShadowNode ||
      (commitOptions.shouldYield && commitOptions.shouldYield())) {
    return CommitStatus::Cancelled;
  }

  // Layout nodes.
  std::vector<const LayoutableShadowNode*> affectedLayoutableNodes{};
  affectedLayoutableNodes.reserve(1024);

  telemetry.willLayout();
  telemetry.setAsThreadLocal();
  newRootShadowNode->layoutIfNeeded(&affectedLayoutableNodes);
  telemetry.unsetAsThreadLocal();
  telemetry.didLayout(static_cast<int>(affectedLayoutableNodes.size()));

  {
    // Updating `currentRevision_` in unique manner if it hasn't changed.
    std::unique_lock lock(commitMutex_);

    if (commitOptions.shouldYield && commitOptions.shouldYield()) {
      return CommitStatus::Cancelled;
    }

    if (CoreFeatures::enableGranularShadowTreeStateReconciliation) {
      auto lastRevisionNumberWithNewStateChanged =
          lastRevisionNumberWithNewState != lastRevisionNumberWithNewState_;
      // Commit should only fail if we propagated the wrong state.
      if (commitOptions.enableStateReconciliation &&
          lastRevisionNumberWithNewStateChanged) {
        return CommitStatus::Failed;
      }
    } else {
      if (currentRevision_.number != oldRevision.number) {
        return CommitStatus::Failed;
      }
    }

    auto newRevisionNumber = currentRevision_.number + 1;

    {
      std::scoped_lock dispatchLock(EventEmitter::DispatchMutex());

      updateMountedFlag(
          currentRevision_.rootShadowNode->getChildren(),
          newRootShadowNode->getChildren());
    }

    telemetry.didCommit();
    telemetry.setRevisionNumber(static_cast<int>(newRevisionNumber));

    // Seal the shadow node so it can no longer be mutated
    newRootShadowNode->sealRecursive();

    newRevision = ShadowTreeRevision{
        std::move(newRootShadowNode), newRevisionNumber, telemetry};

    currentRevision_ = newRevision;
    if (!commitOptions.enableStateReconciliation) {
      lastRevisionNumberWithNewState_ = newRevisionNumber;
    }
  }

  emitLayoutEvents(affectedLayoutableNodes);

  if (commitMode == CommitMode::Normal) {
    mount(std::move(newRevision), commitOptions.mountSynchronously);
  }

  return CommitStatus::Succeeded;
}

ShadowTreeRevision ShadowTree::getCurrentRevision() const {
  std::shared_lock lock(commitMutex_);
  return currentRevision_;
}

void ShadowTree::mount(ShadowTreeRevision revision, bool mountSynchronously)
    const {
  mountingCoordinator_->push(std::move(revision));
  delegate_.shadowTreeDidFinishTransaction(
      mountingCoordinator_, mountSynchronously);
}

void ShadowTree::commitEmptyTree() const {
  commit(
      [](const RootShadowNode& oldRootShadowNode) -> RootShadowNode::Unshared {
        return std::make_shared<RootShadowNode>(
            oldRootShadowNode,
            ShadowNodeFragment{
                /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
            });
      },
      {/* default commit options */});
}

void ShadowTree::emitLayoutEvents(
    std::vector<const LayoutableShadowNode*>& affectedLayoutableNodes) const {
  SystraceSection s(
      "ShadowTree::emitLayoutEvents",
      "affectedLayoutableNodes",
      affectedLayoutableNodes.size());

  for (const auto* layoutableNode : affectedLayoutableNodes) {
    // Only instances of `ViewShadowNode` (and subclasses) are supported.
    const auto& viewShadowNode =
        static_cast<const ViewShadowNode&>(*layoutableNode);
    const auto& viewEventEmitter =
        static_cast<const ViewEventEmitter&>(*viewShadowNode.getEventEmitter());

    // Checking if the `onLayout` event was requested for the particular Shadow
    // Node.
    const auto& viewProps =
        static_cast<const ViewProps&>(*viewShadowNode.getProps());
    if (!viewProps.onLayout) {
      continue;
    }

    viewEventEmitter.onLayout(layoutableNode->getLayoutMetrics());
  }
}

void ShadowTree::notifyDelegatesOfUpdates() const {
  delegate_.shadowTreeDidFinishTransaction(mountingCoordinator_, true);
}

} // namespace facebook::react
