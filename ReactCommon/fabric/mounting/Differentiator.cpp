// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Differentiator.h"

#include <better/map.h>
#include <better/small_vector.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/debug/SystraceSection.h>
#include "ShadowView.h"

namespace facebook {
namespace react {

/*
 * Extremely simple and naive implementation of a map.
 * The map is simple but it's optimized for particular constraints that we have
 * here.
 *
 * A regular map implementation (e.g. `std::unordered_map`) has some basic
 * performance guarantees like constant average insertion and lookup complexity.
 * This is nice, but it's *average* complexity measured on a non-trivial amount
 * of data. The regular map is a very complex data structure that using hashing,
 * buckets, multiple comprising operations, multiple allocations and so on.
 *
 * In our particular case, we need a map for `int` to `void *` with a dozen
 * values. In these conditions, nothing can beat a naive implementation using a
 * stack-allocated vector. And this implementation is exactly this: no
 * allocation, no hashing, no complex branching, no buckets, no iterators, no
 * rehashing, no other guarantees. It's crazy limited, unsafe, and performant on
 * a trivial amount of data.
 *
 * Besides that, we also need to optimize for insertion performance (the case
 * where a bunch of views appears on the screen first time); in this
 * implementation, this is as performant as vector `push_back`.
 */
template <typename KeyT, typename ValueT, int DefaultSize = 16>
class TinyMap final {
 public:
  using Pair = std::pair<KeyT, ValueT>;
  using Iterator = Pair *;

  inline Iterator begin() {
    return (Pair *)vector_;
  }

  inline Iterator end() {
    return nullptr;
  }

  inline Iterator find(KeyT key) {
    for (auto &item : vector_) {
      if (item.first == key) {
        return &item;
      }
    }

    return end();
  }

  inline void insert(Pair pair) {
    assert(pair.first != 0);
    vector_.push_back(pair);
  }

  inline void erase(Iterator iterator) {
    static_assert(
        std::is_same<KeyT, Tag>::value,
        "The collection is designed to store only `Tag`s as keys.");
    // Zero is a invalid tag.
    iterator->first = 0;
  }

 private:
  better::small_vector<Pair, DefaultSize> vector_;
};

static void sliceChildShadowNodeViewPairsRecursively(
    ShadowViewNodePair::List &pairList,
    Point layoutOffset,
    ShadowNode const &shadowNode) {
  for (auto const &childShadowNode : shadowNode.getChildren()) {
    auto shadowView = ShadowView(*childShadowNode);

    auto const layoutableShadowNode =
        dynamic_cast<LayoutableShadowNode const *>(childShadowNode.get());
#ifndef ANDROID
    // New approach (iOS):
    // Non-view components are treated as layout-only views (they aren't
    // represented as `ShadowView`s).
    if (!layoutableShadowNode || layoutableShadowNode->isLayoutOnly()) {
#else
    // Previous approach (Android):
    // Non-view components are treated as normal views with an empty layout
    // (they are represented as `ShadowView`s).
    if (layoutableShadowNode && layoutableShadowNode->isLayoutOnly()) {
#endif
      sliceChildShadowNodeViewPairsRecursively(
          pairList,
          layoutOffset + shadowView.layoutMetrics.frame.origin,
          *childShadowNode);
    } else {
      shadowView.layoutMetrics.frame.origin += layoutOffset;
      pairList.push_back({shadowView, childShadowNode.get()});
    }
  }
}

static ShadowViewNodePair::List sliceChildShadowNodeViewPairs(
    ShadowNode const &shadowNode) {
  auto pairList = ShadowViewNodePair::List{};
  sliceChildShadowNodeViewPairsRecursively(pairList, {0, 0}, shadowNode);
  return pairList;
}

static void calculateShadowViewMutations(
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::List const &oldChildPairs,
    ShadowViewNodePair::List const &newChildPairs) {
  // The current version of the algorithm is otimized for simplicity,
  // not for performance or optimal result.

  if (oldChildPairs == newChildPairs) {
    return;
  }

  if (oldChildPairs.size() == 0 && newChildPairs.size() == 0) {
    return;
  }

  auto index = int{0};

  // Maps inserted node tags to pointers to them in `newChildPairs`.
  auto insertedPairs = TinyMap<Tag, ShadowViewNodePair const *>{};

  // Lists of mutations
  auto createMutations = ShadowViewMutation::List{};
  auto deleteMutations = ShadowViewMutation::List{};
  auto insertMutations = ShadowViewMutation::List{};
  auto removeMutations = ShadowViewMutation::List{};
  auto updateMutations = ShadowViewMutation::List{};
  auto downwardMutations = ShadowViewMutation::List{};
  auto destructiveDownwardMutations = ShadowViewMutation::List{};

  // Stage 1: Collecting `Update` mutations
  for (index = 0; index < oldChildPairs.size() && index < newChildPairs.size();
       index++) {
    auto const &oldChildPair = oldChildPairs[index];
    auto const &newChildPair = newChildPairs[index];

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

    auto const oldGrandChildPairs =
        sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
    auto const newGrandChildPairs =
        sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
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
    auto const &newChildPair = newChildPairs[index];

    insertMutations.push_back(ShadowViewMutation::InsertMutation(
          parentShadowView, newChildPair.shadowView, index));

    insertedPairs.insert({newChildPair.shadowView.tag, &newChildPair});
  }

  // Stage 3: Collecting `Delete` and `Remove` mutations
  for (index = lastIndexAfterFirstStage; index < oldChildPairs.size();
       index++) {
    auto const &oldChildPair = oldChildPairs[index];

    // Even if the old view was (re)inserted, we have to generate `remove`
    // mutation.
    removeMutations.push_back(ShadowViewMutation::RemoveMutation(
        parentShadowView, oldChildPair.shadowView, index));

    auto const it = insertedPairs.find(oldChildPair.shadowView.tag);

    if (it == insertedPairs.end()) {
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
          sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode),
          {});
    } else {
      // The old view *was* (re)inserted.
      // We have to call the algorithm recursively if the inserted view
      // is *not* the same as removed one.
      auto const &newChildPair = *it->second;

      if (newChildPair != oldChildPair) {
        auto const oldGrandChildPairs =
            sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
        auto const newGrandChildPairs =
            sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
        calculateShadowViewMutations(
            *(newGrandChildPairs.size() ? &downwardMutations
                                        : &destructiveDownwardMutations),
            newChildPair.shadowView,
            oldGrandChildPairs,
            newGrandChildPairs);
      }

      // In any case we have to remove the view from `insertedPairs` as
      // indication that the view was actually removed (which means that
      // the view existed before), hence we don't have to generate
      // `create` mutation.
      insertedPairs.erase(it);
    }
  }

  // Stage 4: Collecting `Create` mutations
  for (index = lastIndexAfterFirstStage; index < newChildPairs.size();
       index++) {
    auto const &newChildPair = newChildPairs[index];

    if (insertedPairs.find(newChildPair.shadowView.tag) ==
        insertedPairs.end()) {
      // The new view was (re)inserted, so there is no need to create it.
      continue;
    }

    createMutations.push_back(
        ShadowViewMutation::CreateMutation(newChildPair.shadowView));

    calculateShadowViewMutations(
        downwardMutations,
        newChildPair.shadowView,
        {},
        sliceChildShadowNodeViewPairs(*newChildPair.shadowNode));
  }

  // All mutations in an optimal order:
  std::move(
      destructiveDownwardMutations.begin(),
      destructiveDownwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      updateMutations.begin(),
      updateMutations.end(),
      std::back_inserter(mutations));
  std::move(
      removeMutations.rbegin(),
      removeMutations.rend(),
      std::back_inserter(mutations));
  std::move(
      deleteMutations.begin(),
      deleteMutations.end(),
      std::back_inserter(mutations));
  std::move(
      createMutations.begin(),
      createMutations.end(),
      std::back_inserter(mutations));
  std::move(
      downwardMutations.begin(),
      downwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      insertMutations.begin(),
      insertMutations.end(),
      std::back_inserter(mutations));
}

ShadowViewMutation::List calculateShadowViewMutations(
    ShadowNode const &oldRootShadowNode,
    ShadowNode const &newRootShadowNode) {
  SystraceSection s("calculateShadowViewMutations");

  // Root shadow nodes must be belong the same family.
  assert(ShadowNode::sameFamily(oldRootShadowNode, newRootShadowNode));

  auto mutations = ShadowViewMutation::List{};
  mutations.reserve(256);

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
