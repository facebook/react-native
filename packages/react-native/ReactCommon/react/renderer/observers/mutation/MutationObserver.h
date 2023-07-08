/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <memory>
#include <utility>

namespace facebook::react {

using MutationObserverId = int32_t;

struct MutationRecord {
  MutationObserverId mutationObserverId;
  ShadowNode::Shared targetShadowNode;
  std::vector<ShadowNode::Shared> addedShadowNodes;
  std::vector<ShadowNode::Shared> removedShadowNodes;
};

class MutationObserver {
 public:
  MutationObserver(MutationObserverId intersectionObserverId);

  void observe(ShadowNode::Shared targetShadowNode, bool observeSubtree);
  void unobserve(ShadowNode const &targetShadowNode);

  bool isObserving() const;

  void recordMutations(
      RootShadowNode const &oldRootShadowNode,
      RootShadowNode const &newRootShadowNode,
      std::vector<const MutationRecord> &recordedMutations) const;

 private:
  MutationObserverId mutationObserverId_;
  std::vector<ShadowNode::Shared> deeplyObservedShadowNodes_;
  std::vector<ShadowNode::Shared> shallowlyObservedShadowNodes_;

  using SetOfShadowNodePointers = std::unordered_set<ShadowNode const *>;

  void recordMutationsInTarget(
      ShadowNode::Shared targetShadowNode,
      RootShadowNode const &oldRootShadowNode,
      RootShadowNode const &newRootShadowNode,
      bool observeSubtree,
      std::vector<const MutationRecord> &recordedMutations,
      SetOfShadowNodePointers &processedNodes) const;

  void recordMutationsInSubtrees(
      ShadowNode::Shared targetShadowNode,
      ShadowNode const &oldNode,
      ShadowNode const &newNode,
      bool observeSubtree,
      std::vector<const MutationRecord> &recordedMutations,
      SetOfShadowNodePointers processedNodes) const;
};

} // namespace facebook::react
