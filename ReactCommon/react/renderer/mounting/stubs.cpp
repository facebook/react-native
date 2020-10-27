/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "stubs.h"

#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/mounting/Differentiator.h>

namespace facebook {
namespace react {

/*
 * Generates `create` and `insert` instructions recursively traversing a shadow
 * tree.
 * This is a trivial implementation of diffing algorithm that can only "diff"
 * an empty tree with some other one.
 */
static void calculateShadowViewMutationsForNewTree(
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::List const &newChildPairs) {
  for (auto index = 0; index < newChildPairs.size(); index++) {
    auto const &newChildPair = newChildPairs[index];

    mutations.push_back(
        ShadowViewMutation::CreateMutation(newChildPair.shadowView));
    mutations.push_back(ShadowViewMutation::InsertMutation(
        parentShadowView, newChildPair.shadowView, index));

    auto const newGrandChildPairs =
        sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);

    calculateShadowViewMutationsForNewTree(
        mutations, newChildPair.shadowView, newGrandChildPairs);
  }
}

StubViewTree stubViewTreeFromShadowNode(ShadowNode const &rootShadowNode) {
  auto mutations = ShadowViewMutation::List{};
  mutations.reserve(256);

  calculateShadowViewMutationsForNewTree(
      mutations,
      ShadowView(rootShadowNode),
      sliceChildShadowNodeViewPairs(rootShadowNode));

  auto emptyRootShadowNode = rootShadowNode.clone(
      ShadowNodeFragment{ShadowNodeFragment::propsPlaceholder(),
                         ShadowNode::emptySharedShadowNodeSharedList()});

  auto stubViewTree = StubViewTree(ShadowView(*emptyRootShadowNode));
  stubViewTree.mutate(mutations, true);
  return stubViewTree;
}

} // namespace react
} // namespace facebook
