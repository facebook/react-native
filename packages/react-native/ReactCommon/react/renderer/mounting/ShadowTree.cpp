/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowTree.h"

#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include "updateMountedFlag.h"

#include "ShadowTreeDelegate.h"

namespace facebook::react {

using CommitStatus = ShadowTree::CommitStatus;
using CommitMode = ShadowTree::CommitMode;

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
      areChildrenChanged ? std::make_shared<const ShadowNode::ListOfShared>(
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
      areChildrenChanged ? std::make_shared<const ShadowNode::ListOfShared>(
                               std::move(newChildren))
                         : ShadowNodeFragment::childrenPlaceholder(),
      isStateChanged ? newState : ShadowNodeFragment::statePlaceholder(),
  });
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

std::shared_ptr<const MountingCoordinator> ShadowTree::getMountingCoordinator()
    const {
  return mountingCoordinator_;
}

CommitStatus ShadowTree::commit(
    const ShadowTreeCommitTransaction& transaction,
    const CommitOptions& commitOptions) const {
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
  TraceSection s("ShadowTree::commit");

  auto telemetry = TransactionTelemetry{};
  telemetry.willCommit();

  CommitMode commitMode;
  auto oldRevision = ShadowTreeRevision{};
  auto newRevision = ShadowTreeRevision{};

  {
    // Reading `currentRevision_` in shared manner.
    std::shared_lock lock(commitMutex_);
    commitMode = commitMode_;
    oldRevision = currentRevision_;
  }

  const auto& oldRootShadowNode = oldRevision.rootShadowNode;
  auto newRootShadowNode = transaction(*oldRevision.rootShadowNode);

  if (!newRootShadowNode) {
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

  // Run commit hooks.
  newRootShadowNode = delegate_.shadowTreeWillCommit(
      *this, oldRootShadowNode, newRootShadowNode);

  if (!newRootShadowNode) {
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

    if (currentRevision_.number != oldRevision.number) {
      return CommitStatus::Failed;
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
    // Does nothing in release.
    newRootShadowNode->sealRecursive();

    newRevision = ShadowTreeRevision{
        std::move(newRootShadowNode), newRevisionNumber, telemetry};

    currentRevision_ = newRevision;
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
  TraceSection s(
      "ShadowTree::emitLayoutEvents",
      "affectedLayoutableNodes",
      affectedLayoutableNodes.size());

  for (const auto* layoutableNode : affectedLayoutableNodes) {
    if (auto viewProps =
            dynamic_cast<const ViewProps*>(layoutableNode->getProps().get())) {
      if (viewProps->onLayout) {
        static_cast<const BaseViewEventEmitter&>(
            *layoutableNode->getEventEmitter())
            .onLayout(layoutableNode->getLayoutMetrics());
      }
    }
  }
}

void ShadowTree::notifyDelegatesOfUpdates() const {
  delegate_.shadowTreeDidFinishTransaction(mountingCoordinator_, true);
}

} // namespace facebook::react
