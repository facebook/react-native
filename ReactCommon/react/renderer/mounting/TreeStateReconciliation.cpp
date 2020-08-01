/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TreeStateReconciliation.h"

namespace facebook {
namespace react {

using ChangedShadowNodePairs =
    std::vector<std::pair<ShadowNode::Shared, ShadowNode::Unshared>>;

/**
 * Clones any children in the subtree that need to be cloned, and adds those to
 * the `changedPairs` vector argument.
 */
static ChangedShadowNodePairs reconcileStateWithChildren(
    SharedShadowNodeList const &newChildren,
    SharedShadowNodeList const &oldChildren) {
  ChangedShadowNodePairs changedPairs;
  // Find children that are the same family in both trees.
  // We only want to find nodes that existing in the new tree - if they
  // don't exist in the new tree, they're being deleted; if they don't exist
  // in the old tree, they're new. We don't need to deal with either of those
  // cases here.
  // Currently we use a naive double loop - this could be improved, but we need
  // to be able to handle cases where nodes are entirely reordered, for
  // instance.
  for (auto const &child : newChildren) {
    auto const oldChild = std::find_if(
        oldChildren.begin(), oldChildren.end(), [&](const auto &el) {
          return ShadowNode::sameFamily(*child, *el);
        });

    if (oldChild != oldChildren.end()) {
      UnsharedShadowNode newChild =
          reconcileStateWithTree(child.get(), *oldChild);
      if (newChild != nullptr) {
        changedPairs.push_back(std::make_pair(child, newChild));
      }
    }
  };

  return changedPairs;
}

UnsharedShadowNode reconcileStateWithTree(
    ShadowNode const *newNode,
    SharedShadowNode committedNode) {
  // If the revisions on the node are the same, we can finish here.
  // Subtrees are guaranteed to be identical at this point, too.
  if (committedNode->getStateRevision() <= newNode->getStateRevision()) {
    return nullptr;
  }

  // If we got this fair, we're guaranteed that the state of 1) this node,
  // and/or 2) some descendant node is out-of-date and must be reconciled.
  // This requires traversing all children, and we must at *least* clone
  // this node, whether or not we clone and update any children.
  auto const &newChildren = newNode->getChildren();
  auto const &oldChildren = committedNode->getChildren();
  auto const changedPairs =
      reconcileStateWithChildren(newChildren, oldChildren);

  ShadowNode::SharedListOfShared clonedChildren =
      ShadowNodeFragment::childrenPlaceholder();

  // If any children were cloned, we need to recreate the child list.
  // This won't cause any children to be cloned that weren't already cloned -
  // it just collects all children, cloned or uncloned, into a new list.
  if (!changedPairs.empty()) {
    ShadowNode::UnsharedListOfShared newList =
        std::make_shared<ShadowNode::ListOfShared>();
    for (std::size_t i = 0, j = 0; i < newChildren.size(); ++i) {
      if (j < changedPairs.size() && changedPairs[j].first == newChildren[i]) {
        newList->push_back(changedPairs[j].second);
        ++j;
      } else {
        newList->push_back(newChildren[i]);
      }
    }
    clonedChildren = newList;
  }

  return newNode->clone({/* .props = */ ShadowNodeFragment::propsPlaceholder(),
                         /* .children = */ clonedChildren,
                         /* .state = */ newNode->getMostRecentState()});
}

} // namespace react
} // namespace facebook
