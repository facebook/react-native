/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "stubs.h"

#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/mounting/Differentiator.h>

namespace facebook::react {

/*
 * Sorting comparator for `reorderInPlaceIfNeeded`.
 */
static bool shouldFirstPairComesBeforeSecondOne(
    const ShadowViewNodePair* lhs,
    const ShadowViewNodePair* rhs) noexcept {
  return lhs->shadowNode->getOrderIndex() < rhs->shadowNode->getOrderIndex();
}

/*
 * Reorders pairs in-place based on `orderIndex` using a stable sort algorithm.
 */
static void reorderInPlaceIfNeeded(
    std::vector<ShadowViewNodePair*>& pairs) noexcept {
  // This is a simplified version of the function intentionally copied from
  // `Differentiator.cpp`.
  std::stable_sort(
      pairs.begin(), pairs.end(), &shouldFirstPairComesBeforeSecondOne);
}

/*
 * Generates `create` and `insert` instructions recursively traversing a shadow
 * tree.
 * This is a trivial implementation of diffing algorithm that can only "diff"
 * an empty tree with some other one.
 */
static void calculateShadowViewMutationsForNewTree(
    ShadowViewMutation::List& mutations,
    ViewNodePairScope& scope,
    const ShadowView& parentShadowView,
    std::vector<ShadowViewNodePair*> newChildPairs) {
  // Sorting pairs based on `orderIndex` if needed.
  reorderInPlaceIfNeeded(newChildPairs);

  for (auto newChildPair : newChildPairs) {
    if (!newChildPair->isConcreteView) {
      continue;
    }

    mutations.push_back(
        ShadowViewMutation::CreateMutation(newChildPair->shadowView));
    mutations.push_back(ShadowViewMutation::InsertMutation(
        parentShadowView,
        newChildPair->shadowView,
        static_cast<int>(newChildPair->mountIndex)));

    auto newGrandChildPairs =
        sliceChildShadowNodeViewPairs(*newChildPair, scope);

    calculateShadowViewMutationsForNewTree(
        mutations, scope, newChildPair->shadowView, newGrandChildPairs);
  }
}

StubViewTree buildStubViewTreeWithoutUsingDifferentiator(
    const ShadowNode& rootShadowNode) {
  auto mutations = ShadowViewMutation::List{};
  mutations.reserve(256);

  ViewNodePairScope scope;
  ShadowViewNodePair rootShadowNodePair{.shadowNode = &rootShadowNode};
  calculateShadowViewMutationsForNewTree(
      mutations,
      scope,
      ShadowView(rootShadowNode),
      sliceChildShadowNodeViewPairs(rootShadowNodePair, scope));

  auto emptyRootShadowNode = rootShadowNode.clone(ShadowNodeFragment{
      ShadowNodeFragment::propsPlaceholder(),
      ShadowNode::emptySharedShadowNodeSharedList()});

  auto stubViewTree = StubViewTree(ShadowView(*emptyRootShadowNode));
  stubViewTree.mutate(mutations);
  return stubViewTree;
}

StubViewTree buildStubViewTreeUsingDifferentiator(
    const ShadowNode& rootShadowNode) {
  auto emptyRootShadowNode = rootShadowNode.clone(ShadowNodeFragment{
      ShadowNodeFragment::propsPlaceholder(),
      ShadowNode::emptySharedShadowNodeSharedList()});

  auto mutations =
      calculateShadowViewMutations(*emptyRootShadowNode, rootShadowNode);

  auto stubViewTree = StubViewTree(ShadowView(*emptyRootShadowNode));
  stubViewTree.mutate(mutations);
  return stubViewTree;
}

} // namespace facebook::react
