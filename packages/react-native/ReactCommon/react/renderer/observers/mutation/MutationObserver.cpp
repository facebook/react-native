/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MutationObserver.h"
#include <react/renderer/core/ShadowNodeTraits.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

MutationObserver::MutationObserver(MutationObserverId mutationObserverId)
    : mutationObserverId_(mutationObserverId) {}

void MutationObserver::observe(
    ShadowNode::Shared targetShadowNode,
    bool observeSubtree) {
  if (observeSubtree) {
    deeplyObservedShadowNodes_.push_back(targetShadowNode);
  } else {
    shallowlyObservedShadowNodes_.push_back(targetShadowNode);
  }
}

void MutationObserver::unobserve(const ShadowNode& targetShadowNode) {
  // We don't know if it's being observed deeply or not, so we need to check
  // both possibilities.
  deeplyObservedShadowNodes_.erase(
      std::remove_if(
          deeplyObservedShadowNodes_.begin(),
          deeplyObservedShadowNodes_.end(),
          [&targetShadowNode](auto shadowNode) {
            return ShadowNode::sameFamily(*shadowNode, targetShadowNode);
          }),
      deeplyObservedShadowNodes_.end());

  shallowlyObservedShadowNodes_.erase(
      std::remove_if(
          shallowlyObservedShadowNodes_.begin(),
          shallowlyObservedShadowNodes_.end(),
          [&targetShadowNode](const auto shadowNode) {
            return ShadowNode::sameFamily(*shadowNode, targetShadowNode);
          }),
      shallowlyObservedShadowNodes_.end());
}

bool MutationObserver::isObserving() const {
  return !deeplyObservedShadowNodes_.empty() ||
      !shallowlyObservedShadowNodes_.empty();
}

static ShadowNode::Shared getShadowNodeInTree(
    const ShadowNode& shadowNode,
    const ShadowNode& newTree) {
  auto ancestors = shadowNode.getFamily().getAncestors(newTree);
  if (ancestors.empty()) {
    return nullptr;
  }

  auto pair = ancestors.rbegin();
  return pair->first.get().getChildren().at(pair->second);
}

static ShadowNode::Shared findNodeOfSameFamily(
    const ShadowNode::ListOfShared& list,
    const ShadowNode& node) {
  for (auto& current : list) {
    if (ShadowNode::sameFamily(node, *current)) {
      return current;
    }
  }
  return nullptr;
}

void MutationObserver::recordMutations(
    const RootShadowNode& oldRootShadowNode,
    const RootShadowNode& newRootShadowNode,
    std::vector<const MutationRecord>& recordedMutations) const {
  // This tracks the nodes that have already been processed by this observer,
  // so we avoid unnecessary work and duplicated entries.
  SetOfShadowNodePointers processedNodes;

  // We go over the deeply observed nodes first to avoid skipping nodes that
  // have only been checked shallowly.
  for (auto targetShadowNode : deeplyObservedShadowNodes_) {
    recordMutationsInTarget(
        targetShadowNode,
        oldRootShadowNode,
        newRootShadowNode,
        true,
        recordedMutations,
        processedNodes);
  }

  for (auto targetShadowNode : shallowlyObservedShadowNodes_) {
    recordMutationsInTarget(
        targetShadowNode,
        oldRootShadowNode,
        newRootShadowNode,
        false,
        recordedMutations,
        processedNodes);
  }
}

void MutationObserver::recordMutationsInTarget(
    ShadowNode::Shared targetShadowNode,
    const RootShadowNode& oldRootShadowNode,
    const RootShadowNode& newRootShadowNode,
    bool observeSubtree,
    std::vector<const MutationRecord>& recordedMutations,
    SetOfShadowNodePointers& processedNodes) const {
  // If the node isnt't present in the old tree, it's either:
  // - A new node. In that case, the mutation happened in its parent, not in the
  //   node itself.
  // - A non-existent node. In that case, there are no new mutations.
  auto oldTargetShadowNode =
      getShadowNodeInTree(*targetShadowNode, oldRootShadowNode);
  if (!oldTargetShadowNode) {
    return;
  }

  // If the node isn't present in the new tree (and we didn't return in the
  // previous check), it means the whole node was removed. In that case we don't
  // record any mutations in the node itself (maybe in its parent if there are
  // other observers set up).
  auto newTargetShadowNode =
      getShadowNodeInTree(*targetShadowNode, newRootShadowNode);
  if (!newTargetShadowNode) {
    return;
  }

  recordMutationsInSubtrees(
      std::move(targetShadowNode),
      *oldTargetShadowNode,
      *newTargetShadowNode,
      observeSubtree,
      recordedMutations,
      processedNodes);
}

void MutationObserver::recordMutationsInSubtrees(
    ShadowNode::Shared targetShadowNode,
    const ShadowNode& oldNode,
    const ShadowNode& newNode,
    bool observeSubtree,
    std::vector<const MutationRecord>& recordedMutations,
    SetOfShadowNodePointers processedNodes) const {
  bool isSameNode = &oldNode == &newNode;
  // If the nodes are referentially equal, their children are also the same.
  if (isSameNode || processedNodes.find(&newNode) != processedNodes.end()) {
    return;
  }

  processedNodes.insert(&newNode);

  auto oldChildren = oldNode.getChildren();
  auto newChildren = newNode.getChildren();

  std::vector<ShadowNode::Shared> addedNodes;
  std::vector<ShadowNode::Shared> removedNodes;

  // Check for removed nodes (and equal nodes for further inspection)
  for (auto& oldChild : oldChildren) {
    auto newChild = findNodeOfSameFamily(newChildren, *oldChild);
    if (!newChild) {
      removedNodes.push_back(oldChild);
    } else if (observeSubtree) {
      // Nodes are present in both tress. If `subtree` is set to true,
      // we continue checking their children.
      recordMutationsInSubtrees(
          targetShadowNode,
          *oldChild,
          *newChild,
          observeSubtree,
          recordedMutations,
          processedNodes);
    }
  }

  // Check for added nodes
  for (auto& newChild : newChildren) {
    auto oldChild = findNodeOfSameFamily(oldChildren, *newChild);
    if (!oldChild) {
      addedNodes.push_back(newChild);
    }
  }

  if (!addedNodes.empty() || !removedNodes.empty()) {
    recordedMutations.emplace_back(MutationRecord{
        mutationObserverId_,
        targetShadowNode,
        std::move(addedNodes),
        std::move(removedNodes)});
  }
}

} // namespace facebook::react
