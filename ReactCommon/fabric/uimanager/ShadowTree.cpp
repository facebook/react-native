// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ShadowTree.h"

#include <fabric/core/LayoutContext.h>
#include <fabric/core/LayoutPrimitives.h>

#include "ShadowTreeDelegate.h"
#include "Differentiator.h"
#include "ShadowViewMutation.h"

namespace facebook {
namespace react {

ShadowTree::ShadowTree(Tag rootTag):
  rootTag_(rootTag) {

  const auto noopEventEmitter = std::make_shared<const ViewEventEmitter>(nullptr, rootTag, nullptr);
  rootShadowNode_ = std::make_shared<RootShadowNode>(
    ShadowNodeFragment {
      .tag = rootTag,
      .rootTag = rootTag,
      .props = RootShadowNode::defaultSharedProps(),
      .eventEmitter = noopEventEmitter,
      .children = ShadowNode::emptySharedShadowNodeSharedList(),
    },
    nullptr
  );
}

Tag ShadowTree::getRootTag() const {
  return rootTag_;
}

#pragma mark - Layout

Size ShadowTree::measure(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const {
  auto newRootShadowNode = cloneRootShadowNode(layoutConstraints, layoutContext);
  newRootShadowNode->layout();
  return newRootShadowNode->getLayoutMetrics().frame.size;
}

void ShadowTree::constraintLayout(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) {
  auto newRootShadowNode = cloneRootShadowNode(layoutConstraints, layoutContext);
  complete(newRootShadowNode);
}

#pragma mark - Commiting

UnsharedRootShadowNode ShadowTree::cloneRootShadowNode(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext) const {
  auto oldRootShadowNode = rootShadowNode_;
  const auto &props = std::make_shared<const RootProps>(*oldRootShadowNode->getProps(), layoutConstraints, layoutContext);
  auto newRootShadowNode =
    std::make_shared<RootShadowNode>(*oldRootShadowNode, ShadowNodeFragment {.props = props});
  return newRootShadowNode;
}

void ShadowTree::complete(const SharedShadowNodeUnsharedList &rootChildNodes) {
  auto oldRootShadowNode = rootShadowNode_;
  auto newRootShadowNode =
    std::make_shared<RootShadowNode>(
      *oldRootShadowNode,
      ShadowNodeFragment {
        .children = SharedShadowNodeSharedList(rootChildNodes)
      }
    );

  complete(newRootShadowNode);
}

void ShadowTree::complete(UnsharedRootShadowNode newRootShadowNode) {
  SharedRootShadowNode oldRootShadowNode = rootShadowNode_;

  newRootShadowNode->layout();

  newRootShadowNode->sealRecursive();

  auto mutations = calculateShadowViewMutations(
    *oldRootShadowNode,
    *newRootShadowNode
  );

  if (commit(oldRootShadowNode, newRootShadowNode, mutations)) {
    emitLayoutEvents(mutations);

    if (delegate_) {
      delegate_->shadowTreeDidCommit(shared_from_this(), mutations);
    }
  }
}

bool ShadowTree::commit(
  const SharedRootShadowNode &oldRootShadowNode,
  const SharedRootShadowNode &newRootShadowNode,
  const ShadowViewMutationList &mutations
) {
  std::lock_guard<std::mutex> lock(commitMutex_);

  if (oldRootShadowNode != rootShadowNode_) {
    return false;
  }

  rootShadowNode_ = newRootShadowNode;

  toggleEventEmitters(mutations);
  return true;
}

void ShadowTree::emitLayoutEvents(const ShadowViewMutationList &mutations) {
  for (const auto &mutation : mutations) {
    // Only `Insert` and `Update` mutations can affect layout metrics.
    if (
      mutation.type != ShadowViewMutation::Insert &&
      mutation.type != ShadowViewMutation::Update
    ) {
      continue;
    }

    const auto viewEventEmitter = std::dynamic_pointer_cast<const ViewEventEmitter>(mutation.newChildShadowView.eventEmitter);

    // Checking if particular shadow node supports `onLayout` event (part of `ViewEventEmitter`).
    if (!viewEventEmitter) {
      continue;
    }

    // Checking if the `onLayout` event was requested for the particular Shadow Node.
    const auto viewProps = std::dynamic_pointer_cast<const ViewProps>(mutation.newChildShadowView.props);
    if (viewProps && !viewProps->onLayout) {
      continue;
    }

    // In case if we have `oldChildShadowView`, checking that layout metrics have changed.
    if (
      mutation.type != ShadowViewMutation::Update &&
      mutation.oldChildShadowView.layoutMetrics == mutation.newChildShadowView.layoutMetrics
    ) {
      continue;
    }

    viewEventEmitter->onLayout(mutation.newChildShadowView.layoutMetrics);
  }
}

void ShadowTree::toggleEventEmitters(const ShadowViewMutationList &mutations) {
  std::lock_guard<std::recursive_mutex> lock(EventEmitter::DispatchMutex());

  for (const auto &mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Delete) {
      mutation.oldChildShadowView.eventEmitter->setEnabled(false);
    }
  }

  for (const auto &mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Create) {
      mutation.newChildShadowView.eventEmitter->setEnabled(true);
    }
  }
}

#pragma mark - Delegate

void ShadowTree::setDelegate(ShadowTreeDelegate *delegate) {
  delegate_ = delegate;
}

ShadowTreeDelegate *ShadowTree::getDelegate() const {
  return delegate_;
}

} // namespace react
} // namespace facebook
