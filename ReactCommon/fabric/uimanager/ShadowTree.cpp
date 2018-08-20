// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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

  TreeMutationInstructionList instructions = TreeMutationInstructionList();

  calculateMutationInstructions(
    instructions,
    oldRootShadowNode,
    newRootShadowNode
  );

  if (commit(oldRootShadowNode, newRootShadowNode)) {
    emitLayoutEvents(instructions);

    if (delegate_) {
      delegate_->shadowTreeDidCommit(shared_from_this(), instructions);
    }
  }
}

bool ShadowTree::commit(const SharedRootShadowNode &oldRootShadowNode, const SharedRootShadowNode &newRootShadowNode) {
  std::lock_guard<std::mutex> lock(commitMutex_);

  if (oldRootShadowNode != rootShadowNode_) {
    return false;
  }

  rootShadowNode_ = newRootShadowNode;
  return true;
}

void ShadowTree::emitLayoutEvents(const TreeMutationInstructionList &instructions) {
  for (const auto &instruction : instructions) {
    const auto &type = instruction.getType();

    // Only `Insertion` and `Replacement` instructions can affect layout metrics.
    if (
        type == TreeMutationInstruction::Insertion ||
        type == TreeMutationInstruction::Replacement
    ) {
      const auto &newShadowNode = instruction.getNewChildNode();
      const auto &eventEmitter = newShadowNode->getEventEmitter();
      const auto &viewEventEmitter = std::dynamic_pointer_cast<const ViewEventEmitter>(eventEmitter);

      // Checking if particular shadow node supports `onLayout` event (part of `ViewEventEmitter`).
      if (viewEventEmitter) {
        // Now we know that both (old and new) shadow nodes must be `LayoutableShadowNode` subclasses.
        assert(std::dynamic_pointer_cast<const LayoutableShadowNode>(newShadowNode));

        // Checking if the `onLayout` event was requested for the particular Shadow Node.
        const auto &viewProps = std::dynamic_pointer_cast<const ViewProps>(newShadowNode->getProps());
        if (viewProps && !viewProps->onLayout) {
          continue;
        }

        // TODO(T29661055): Consider using `std::reinterpret_pointer_cast`.
        const auto &newLayoutableShadowNode =
          std::dynamic_pointer_cast<const LayoutableShadowNode>(newShadowNode);

        // In case if we have `oldShadowNode`, we have to check that layout metrics have changed.
        if (type == TreeMutationInstruction::Replacement) {
          const auto &oldShadowNode = instruction.getOldChildNode();
          assert(std::dynamic_pointer_cast<const LayoutableShadowNode>(oldShadowNode));
          // TODO(T29661055): Consider using `std::reinterpret_pointer_cast`.
          const auto &oldLayoutableShadowNode =
            std::dynamic_pointer_cast<const LayoutableShadowNode>(oldShadowNode);

          if (oldLayoutableShadowNode->getLayoutMetrics() == newLayoutableShadowNode->getLayoutMetrics()) {
            continue;
          }
        }

        viewEventEmitter->onLayout(newLayoutableShadowNode->getLayoutMetrics());
      }
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
