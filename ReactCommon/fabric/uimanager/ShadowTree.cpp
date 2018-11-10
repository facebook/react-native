// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ShadowTree.h"

#include <react/core/LayoutContext.h>
#include <react/core/LayoutPrimitives.h>

#include "Differentiator.h"
#include "ShadowTreeDelegate.h"
#include "ShadowViewMutation.h"

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
  complete(std::make_shared<SharedShadowNodeList>(SharedShadowNodeList{}));
}

Tag ShadowTree::getSurfaceId() const {
  return surfaceId_;
}

SharedRootShadowNode ShadowTree::getRootShadowNode() const {
  std::lock_guard<std::recursive_mutex> lock(commitMutex_);
  return rootShadowNode_;
}

void ShadowTree::synchronize(std::function<void(void)> function) const {
  std::lock_guard<std::recursive_mutex> lock(commitMutex_);
  function();
}

#pragma mark - Layout

Size ShadowTree::measure(
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  auto newRootShadowNode = cloneRootShadowNode(
      getRootShadowNode(), layoutConstraints, layoutContext);
  newRootShadowNode->layout();
  return newRootShadowNode->getLayoutMetrics().frame.size;
}

bool ShadowTree::constraintLayout(
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  auto oldRootShadowNode = getRootShadowNode();
  auto newRootShadowNode =
      cloneRootShadowNode(oldRootShadowNode, layoutConstraints, layoutContext);
  return complete(oldRootShadowNode, newRootShadowNode);
}

#pragma mark - Commiting

UnsharedRootShadowNode ShadowTree::cloneRootShadowNode(
    const SharedRootShadowNode &oldRootShadowNode,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  auto props = std::make_shared<const RootProps>(
      *oldRootShadowNode->getProps(), layoutConstraints, layoutContext);
  auto newRootShadowNode = std::make_shared<RootShadowNode>(
      *oldRootShadowNode, ShadowNodeFragment{.props = props});
  return newRootShadowNode;
}

bool ShadowTree::complete(
    const SharedShadowNodeUnsharedList &rootChildNodes) const {
  auto oldRootShadowNode = getRootShadowNode();
  auto newRootShadowNode = std::make_shared<RootShadowNode>(
      *oldRootShadowNode,
      ShadowNodeFragment{.children =
                             SharedShadowNodeSharedList(rootChildNodes)});

  return complete(oldRootShadowNode, newRootShadowNode);
}

bool ShadowTree::complete(
    const SharedRootShadowNode &oldRootShadowNode,
    const UnsharedRootShadowNode &newRootShadowNode) const {
  newRootShadowNode->layout();
  newRootShadowNode->sealRecursive();

  auto mutations =
      calculateShadowViewMutations(*oldRootShadowNode, *newRootShadowNode);

  if (!commit(oldRootShadowNode, newRootShadowNode, mutations)) {
    return false;
  }

  emitLayoutEvents(mutations);

  if (delegate_) {
    delegate_->shadowTreeDidCommit(*this, mutations);
  }

  return true;
}

bool ShadowTree::commit(
    const SharedRootShadowNode &oldRootShadowNode,
    const SharedRootShadowNode &newRootShadowNode,
    const ShadowViewMutationList &mutations) const {
  std::lock_guard<std::recursive_mutex> lock(commitMutex_);

  if (oldRootShadowNode != rootShadowNode_) {
    return false;
  }

  rootShadowNode_ = newRootShadowNode;

  toggleEventEmitters(mutations);

  return true;
}

void ShadowTree::emitLayoutEvents(
    const ShadowViewMutationList &mutations) const {
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
      mutation.newChildShadowView.eventEmitter->enable();
    }
  }

  for (const auto &mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Delete) {
      mutation.oldChildShadowView.eventEmitter->disable();
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
