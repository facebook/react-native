/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowTree.h"

#include <react/components/root/RootComponentDescriptor.h>
#include <react/components/view/ViewShadowNode.h>
#include <react/core/LayoutContext.h>
#include <react/core/LayoutPrimitives.h>
#include <react/debug/SystraceSection.h>
#include <react/mounting/MountingTelemetry.h>
#include <react/mounting/ShadowTreeRevision.h>
#include <react/mounting/ShadowViewMutation.h>

#include "ShadowTreeDelegate.h"
#include "TreeStateReconciliation.h"

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

    if (!ShadowNode::sameFamily(*oldChild, *newChild)) {
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
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext,
    RootComponentDescriptor const &rootComponentDescriptor,
    ShadowTreeDelegate const &delegate)
    : surfaceId_(surfaceId), delegate_(delegate) {
  const auto noopEventEmitter = std::make_shared<const ViewEventEmitter>(
      nullptr, -1, std::shared_ptr<const EventDispatcher>());

  const auto props = std::make_shared<const RootProps>(
      *RootShadowNode::defaultSharedProps(), layoutConstraints, layoutContext);

  auto family = rootComponentDescriptor.createFamily(
      ShadowNodeFamilyFragment{surfaceId, surfaceId, noopEventEmitter},
      nullptr);
  rootShadowNode_ = std::static_pointer_cast<const RootShadowNode>(
      rootComponentDescriptor.createShadowNode(
          ShadowNodeFragment{
              /* .props = */ props,
          },
          family));

  mountingCoordinator_ = std::make_shared<MountingCoordinator const>(
      ShadowTreeRevision{rootShadowNode_, 0, {}});
}

ShadowTree::~ShadowTree() {
  mountingCoordinator_->revoke();
}

Tag ShadowTree::getSurfaceId() const {
  return surfaceId_;
}

MountingCoordinator::Shared ShadowTree::getMountingCoordinator() const {
  return mountingCoordinator_;
}

void ShadowTree::commit(
    ShadowTreeCommitTransaction transaction,
    bool enableStateReconciliation) const {
  SystraceSection s("ShadowTree::commit");

  int attempts = 0;

  while (true) {
    attempts++;
    if (tryCommit(transaction, enableStateReconciliation)) {
      return;
    }

    // After multiple attempts, we failed to commit the transaction.
    // Something internally went terribly wrong.
    assert(attempts < 1024);
  }
}

bool ShadowTree::tryCommit(
    ShadowTreeCommitTransaction transaction,
    bool enableStateReconciliation) const {
  SystraceSection s("ShadowTree::tryCommit");

  auto telemetry = MountingTelemetry{};
  telemetry.willCommit();

  RootShadowNode::Shared oldRootShadowNode;

  {
    // Reading `rootShadowNode_` in shared manner.
    std::shared_lock<better::shared_mutex> lock(commitMutex_);
    oldRootShadowNode = rootShadowNode_;
  }

  RootShadowNode::Unshared newRootShadowNode = transaction(oldRootShadowNode);

  if (!newRootShadowNode) {
    return false;
  }

  // Compare state revisions of old and new root
  // Children of the root node may be mutated in-place
  if (enableStateReconciliation) {
    UnsharedShadowNode reconciledNode =
        reconcileStateWithTree(newRootShadowNode.get(), oldRootShadowNode);
    if (reconciledNode != nullptr) {
      newRootShadowNode = std::make_shared<RootShadowNode>(
          *reconciledNode, ShadowNodeFragment{});
    }
  }

  // Layout nodes
  std::vector<LayoutableShadowNode const *> affectedLayoutableNodes{};
  affectedLayoutableNodes.reserve(1024);

  telemetry.willLayout();
  newRootShadowNode->layoutIfNeeded(&affectedLayoutableNodes);
  telemetry.didLayout();

  // Seal the shadow node so it can no longer be mutated
  newRootShadowNode->sealRecursive();

  auto revisionNumber = ShadowTreeRevision::Number{};

  {
    // Updating `rootShadowNode_` in unique manner if it hasn't changed.
    std::unique_lock<better::shared_mutex> lock(commitMutex_);

    if (rootShadowNode_ != oldRootShadowNode) {
      return false;
    }

    rootShadowNode_ = newRootShadowNode;

    {
      std::lock_guard<std::mutex> dispatchLock(EventEmitter::DispatchMutex());

      updateMountedFlag(
          oldRootShadowNode->getChildren(), newRootShadowNode->getChildren());
    }

    revisionNumber_++;
    revisionNumber = revisionNumber_;
  }

  emitLayoutEvents(affectedLayoutableNodes);

  telemetry.didCommit();

  mountingCoordinator_->push(
      ShadowTreeRevision{newRootShadowNode, revisionNumber, telemetry});

  delegate_.shadowTreeDidFinishTransaction(*this, mountingCoordinator_);

  return true;
}

void ShadowTree::commitEmptyTree() const {
  commit(
      [](RootShadowNode::Shared const &oldRootShadowNode)
          -> RootShadowNode::Unshared {
        return std::make_shared<RootShadowNode>(
            *oldRootShadowNode,
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

} // namespace react
} // namespace facebook
