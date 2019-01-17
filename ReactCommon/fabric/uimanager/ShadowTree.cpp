// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ShadowTree.h"

#include <react/core/LayoutContext.h>
#include <react/core/LayoutPrimitives.h>
#include <react/debug/SystraceSection.h>
#include <react/mounting/Differentiator.h>
#include <react/mounting/ShadowViewMutation.h>

#include "ShadowTreeDelegate.h"

namespace facebook {
namespace react {

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
  commit([](const SharedRootShadowNode &oldRootShadowNode) {
    return std::make_shared<RootShadowNode>(
        *oldRootShadowNode,
        ShadowNodeFragment{.children =
                               ShadowNode::emptySharedShadowNodeSharedList()});
  });
}

Tag ShadowTree::getSurfaceId() const {
  return surfaceId_;
}

bool ShadowTree::commit(
    std::function<UnsharedRootShadowNode(
        const SharedRootShadowNode &oldRootShadowNode)> transaction,
    int attempts,
    int *revision) const {
  SystraceSection s("ShadowTree::commit");

  while (attempts) {
    attempts--;

    SharedRootShadowNode oldRootShadowNode;

    {
      // Reading `rootShadowNode_` in shared manner.
      std::shared_lock<folly::SharedMutex> lock(commitMutex_);
      oldRootShadowNode = rootShadowNode_;
    }

    UnsharedRootShadowNode newRootShadowNode = transaction(oldRootShadowNode);

    if (!newRootShadowNode) {
      break;
    }

    newRootShadowNode->layout();
    newRootShadowNode->sealRecursive();

    auto mutations =
        calculateShadowViewMutations(*oldRootShadowNode, *newRootShadowNode);

    {
      // Updating `rootShadowNode_` in unique manner if it hasn't changed.
      std::unique_lock<folly::SharedMutex> lock(commitMutex_);

      if (rootShadowNode_ != oldRootShadowNode) {
        continue;
      }

      rootShadowNode_ = newRootShadowNode;

      toggleEventEmitters(mutations);

      revision_++;

      // Returning last revision if requested.
      if (revision) {
        *revision = revision_;
      }
    }

    emitLayoutEvents(mutations);

    if (delegate_) {
      delegate_->shadowTreeDidCommit(*this, mutations);
    }

    return true;
  }

  return false;
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

void ShadowTree::toggleEventEmitters(
    const ShadowViewMutationList &mutations) const {
  std::lock_guard<std::recursive_mutex> lock(EventEmitter::DispatchMutex());

  for (const auto &mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Create) {
      mutation.newChildShadowView.eventEmitter->setEnabled(true);
    }
  }

  for (const auto &mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Delete) {
      mutation.oldChildShadowView.eventEmitter->setEnabled(false);
    }
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
