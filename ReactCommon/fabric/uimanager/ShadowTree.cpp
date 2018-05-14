// Copyright 2004-present Facebook. All Rights Reserved.

#include "ShadowTree.h"

#include <fabric/core/LayoutContext.h>
#include <fabric/core/LayoutPrimitives.h>

#include "ShadowTreeDelegate.h"
#include "Differentiator.h"
#include "TreeMutationInstruction.h"

namespace facebook {
namespace react {

ShadowTree::ShadowTree(Tag rootTag):
  rootTag_(rootTag) {

  rootShadowNode_ = std::make_shared<RootShadowNode>(
    rootTag,
    rootTag,
    nullptr,
    RootShadowNode::defaultSharedProps()
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
  auto &&props = std::make_shared<const RootProps>(*oldRootShadowNode->getProps(), layoutConstraints, layoutContext);
  auto newRootShadowNode = std::make_shared<RootShadowNode>(oldRootShadowNode, props, nullptr);
  return newRootShadowNode;
}

void ShadowTree::complete(const SharedShadowNodeUnsharedList &rootChildNodes) {
  auto oldRootShadowNode = rootShadowNode_;
  auto newRootShadowNode =
    std::make_shared<RootShadowNode>(oldRootShadowNode, nullptr, SharedShadowNodeSharedList(rootChildNodes));

  complete(newRootShadowNode);
}

void ShadowTree::complete(UnsharedRootShadowNode newRootShadowNode) {
  SharedRootShadowNode oldRootShadowNode = rootShadowNode_;

  newRootShadowNode->layout();

  newRootShadowNode->sealRecursive();

  TreeMutationInstructionList instructions = TreeMutationInstructionList();

  calculateMutationInstructions(
    instructions,
    oldRootShadowNode,
    oldRootShadowNode->ShadowNode::getChildren(),
    newRootShadowNode->ShadowNode::getChildren()
  );

  if (commit(newRootShadowNode)) {
    if (delegate_) {
      delegate_->shadowTreeDidCommit(shared_from_this(), instructions);
    }
  }
}

bool ShadowTree::commit(const SharedRootShadowNode &newRootShadowNode) {
  std::lock_guard<std::mutex> lock(commitMutex_);

  if (newRootShadowNode->getSourceNode() != rootShadowNode_) {
    return false;
  }

  rootShadowNode_ = newRootShadowNode;
  return true;
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
