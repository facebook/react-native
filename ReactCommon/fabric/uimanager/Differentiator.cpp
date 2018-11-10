// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Differentiator.h"

#include <react/core/LayoutableShadowNode.h>
#include "ShadowView.h"

namespace facebook {
namespace react {

static void sliceChildShadowNodeViewPairsRecursively(
    ShadowViewNodePairList &pairList,
    Point layoutOffset,
    const ShadowNode &shadowNode) {
  for (const auto &childShadowNode : shadowNode.getChildren()) {
    auto shadowView = ShadowView(*childShadowNode);

    const auto layoutableShadowNode =
        dynamic_cast<const LayoutableShadowNode *>(childShadowNode.get());
    if (layoutableShadowNode && layoutableShadowNode->isLayoutOnly()) {
      sliceChildShadowNodeViewPairsRecursively(
          pairList,
          layoutOffset + shadowView.layoutMetrics.frame.origin,
          *childShadowNode);
    } else {
      shadowView.layoutMetrics.frame.origin += layoutOffset;
      pairList.push_back({shadowView, *childShadowNode});
    }
  }
}

static ShadowViewNodePairList sliceChildShadowNodeViewPairs(
    const ShadowNode &shadowNode) {
  ShadowViewNodePairList pairList;
  sliceChildShadowNodeViewPairsRecursively(pairList, {0, 0}, shadowNode);
  return pairList;
}

static void calculateShadowViewMutations(
    ShadowViewMutationList &mutations,
    const ShadowView &parentShadowView,
    const ShadowViewNodePairList &oldChildPairs,
    const ShadowViewNodePairList &newChildPairs) {
  // The current version of the algorithm is otimized for simplicity,
  // not for performance or optimal result.

  if (oldChildPairs == newChildPairs) {
    return;
  }

  if (oldChildPairs.size() == 0 && newChildPairs.size() == 0) {
    return;
  }

  std::unordered_map<Tag, ShadowViewNodePair> insertedPaires;
  int index = 0;

  ShadowViewMutationList createMutations = {};
  ShadowViewMutationList deleteMutations = {};
  ShadowViewMutationList insertMutations = {};
  ShadowViewMutationList removeMutations = {};
  ShadowViewMutationList updateMutations = {};
  ShadowViewMutationList downwardMutations = {};
  ShadowViewMutationList destructiveDownwardMutations = {};

  // Stage 1: Collecting `Update` mutations
  for (index = 0; index < oldChildPairs.size() && index < newChildPairs.size();
       index++) {
    const auto &oldChildPair = oldChildPairs[index];
    const auto &newChildPair = newChildPairs[index];

    if (oldChildPair.shadowView.tag != newChildPair.shadowView.tag) {
      // Totally different nodes, updating is impossible.
      break;
    }

    if (oldChildPair.shadowView != newChildPair.shadowView) {
      updateMutations.push_back(ShadowViewMutation::UpdateMutation(
          parentShadowView,
          oldChildPair.shadowView,
          newChildPair.shadowView,
          index));
    }

    const auto oldGrandChildPairs =
        sliceChildShadowNodeViewPairs(oldChildPair.shadowNode);
    const auto newGrandChildPairs =
        sliceChildShadowNodeViewPairs(newChildPair.shadowNode);
    calculateShadowViewMutations(
        *(newGrandChildPairs.size() ? &downwardMutations
                                    : &destructiveDownwardMutations),
        oldChildPair.shadowView,
        oldGrandChildPairs,
        newGrandChildPairs);
  }

  int lastIndexAfterFirstStage = index;

  // Stage 2: Collecting `Insert` mutations
  for (; index < newChildPairs.size(); index++) {
    const auto &newChildPair = newChildPairs[index];

    insertMutations.push_back(ShadowViewMutation::InsertMutation(
        parentShadowView, newChildPair.shadowView, index));

    insertedPaires.insert({newChildPair.shadowView.tag, newChildPair});
  }

  // Stage 3: Collecting `Delete` and `Remove` mutations
  for (index = lastIndexAfterFirstStage; index < oldChildPairs.size();
       index++) {
    const auto &oldChildPair = oldChildPairs[index];

    // Even if the old view was (re)inserted, we have to generate `remove`
    // mutation.
    removeMutations.push_back(ShadowViewMutation::RemoveMutation(
        parentShadowView, oldChildPair.shadowView, index));

    const auto &it = insertedPaires.find(oldChildPair.shadowView.tag);

    if (it == insertedPaires.end()) {
      // The old view was *not* (re)inserted.
      // We have to generate `delete` mutation and apply the algorithm
      // recursively.
      deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed view.
      calculateShadowViewMutations(
          destructiveDownwardMutations,
          oldChildPair.shadowView,
          sliceChildShadowNodeViewPairs(oldChildPair.shadowNode),
          {});
    } else {
      // The old view *was* (re)inserted.
      // We have to call the algorithm recursively if the inserted view
      // is *not* the same as removed one.
      const auto &newChildPair = it->second;
      if (newChildPair.shadowView != oldChildPair.shadowView) {
        const auto oldGrandChildPairs =
            sliceChildShadowNodeViewPairs(oldChildPair.shadowNode);
        const auto newGrandChildPairs =
            sliceChildShadowNodeViewPairs(newChildPair.shadowNode);
        calculateShadowViewMutations(
            *(newGrandChildPairs.size() ? &downwardMutations
                                        : &destructiveDownwardMutations),
            newChildPair.shadowView,
            oldGrandChildPairs,
            newGrandChildPairs);
      }

      // In any case we have to remove the view from `insertedPaires` as
      // indication that the view was actually removed (which means that
      // the view existed before), hence we don't have to generate
      // `create` mutation.
      insertedPaires.erase(it);
    }
  }

  // Stage 4: Collecting `Create` mutations
  for (index = lastIndexAfterFirstStage; index < newChildPairs.size();
       index++) {
    const auto &newChildPair = newChildPairs[index];

    if (insertedPaires.find(newChildPair.shadowView.tag) ==
        insertedPaires.end()) {
      // The new view was (re)inserted, so there is no need to create it.
      continue;
    }

    createMutations.push_back(
        ShadowViewMutation::CreateMutation(newChildPair.shadowView));

    calculateShadowViewMutations(
        downwardMutations,
        newChildPair.shadowView,
        {},
        sliceChildShadowNodeViewPairs(newChildPair.shadowNode));
  }

  // All mutations in an optimal order:
  mutations.insert(
      mutations.end(),
      destructiveDownwardMutations.begin(),
      destructiveDownwardMutations.end());
  mutations.insert(
      mutations.end(), updateMutations.begin(), updateMutations.end());
  mutations.insert(
      mutations.end(), removeMutations.rbegin(), removeMutations.rend());
  mutations.insert(
      mutations.end(), deleteMutations.begin(), deleteMutations.end());
  mutations.insert(
      mutations.end(), createMutations.begin(), createMutations.end());
  mutations.insert(
      mutations.end(), insertMutations.begin(), insertMutations.end());
  mutations.insert(
      mutations.end(), downwardMutations.begin(), downwardMutations.end());
}

ShadowViewMutationList calculateShadowViewMutations(
    const ShadowNode &oldRootShadowNode,
    const ShadowNode &newRootShadowNode) {
  // Root shadow nodes must have same tag.
  assert(oldRootShadowNode.getTag() == newRootShadowNode.getTag());

  ShadowViewMutationList mutations;

  auto oldRootShadowView = ShadowView(oldRootShadowNode);
  auto newRootShadowView = ShadowView(newRootShadowNode);

  if (oldRootShadowView != newRootShadowView) {
    mutations.push_back(ShadowViewMutation::UpdateMutation(
        ShadowView(), oldRootShadowView, newRootShadowView, -1));
  }

  calculateShadowViewMutations(
      mutations,
      ShadowView(oldRootShadowNode),
      sliceChildShadowNodeViewPairs(oldRootShadowNode),
      sliceChildShadowNodeViewPairs(newRootShadowNode));

  return mutations;
}

} // namespace react
} // namespace facebook
