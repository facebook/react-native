/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Differentiator.h"

#include <better/map.h>
#include <better/small_vector.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/debug/SystraceSection.h>
#include <algorithm>
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

  /**
   * This must strictly only be called from outside of this class.
   */
  inline Iterator begin() {
    // Force a clean so that iterating over this TinyMap doesn't iterate over
    // erased elements. If all elements erased are at the front of the vector,
    // then we don't need to clean.
    cleanVector(erasedAtFront_ != numErased_);

    return begin_();
  }

  inline Iterator end() {
    // `back()` asserts on the vector being non-empty
    if (vector_.size() == 0 || numErased_ == vector_.size()) {
      return nullptr;
    }

    return &vector_.back() + 1;
  }

  inline Iterator find(KeyT key) {
    cleanVector();

    assert(key != 0);

    for (auto it = begin_() + erasedAtFront_; it != end(); it++) {
      if (it->first == key) {
        return it;
      }
    }

    return end();
  }

  inline void insert(Pair pair) {
    assert(pair.first != 0);
    vector_.push_back(pair);
  }

  inline void erase(Iterator iterator) {
    numErased_++;

    // Invalidate tag.
    iterator->first = 0;

    if (iterator == begin_() + erasedAtFront_) {
      erasedAtFront_++;
    }
  }

 private:
  /**
   * Same as begin() but doesn't call cleanVector at the beginning.
   */
  inline Iterator begin_() {
    // `front()` asserts on the vector being non-empty
    if (vector_.size() == 0 || vector_.size() == numErased_) {
      return nullptr;
    }

    return &vector_.front();
  }

  /**
   * Remove erased elements from internal vector.
   * We only modify the vector if erased elements are at least half of the
   * vector.
   */
  inline void cleanVector(bool forceClean = false) {
    if ((numErased_ < (vector_.size() / 2) && !forceClean) ||
        vector_.size() == 0 || numErased_ == 0 ||
        numErased_ == erasedAtFront_) {
      return;
    }

    if (numErased_ == vector_.size()) {
      vector_.clear();
    } else {
      vector_.erase(
          std::remove_if(
              vector_.begin(),
              vector_.end(),
              [](auto const &item) { return item.first == 0; }),
          vector_.end());
    }
    numErased_ = 0;
    erasedAtFront_ = 0;
  }

  better::small_vector<Pair, DefaultSize> vector_;
  int numErased_{0};
  int erasedAtFront_{0};
};

/*
 * Sorting comparator for `reorderInPlaceIfNeeded`.
 */
static bool shouldFirstPairComesBeforeSecondOne(
    ShadowViewNodePair const &lhs,
    ShadowViewNodePair const &rhs) noexcept {
  return lhs.shadowNode->getOrderIndex() < rhs.shadowNode->getOrderIndex();
}

/*
 * Reorders pairs in-place based on `orderIndex` using a stable sort algorithm.
 */
static void reorderInPlaceIfNeeded(ShadowViewNodePair::List &pairs) noexcept {
  if (pairs.size() < 2) {
    return;
  }

  auto isReorderNeeded = false;
  for (auto const &pair : pairs) {
    if (pair.shadowNode->getOrderIndex() != 0) {
      isReorderNeeded = true;
      break;
    }
  }

  if (!isReorderNeeded) {
    return;
  }

  std::stable_sort(
      pairs.begin(), pairs.end(), &shouldFirstPairComesBeforeSecondOne);
}

static void sliceChildShadowNodeViewPairsRecursively(
    ShadowViewNodePair::List &pairList,
    Point layoutOffset,
    ShadowNode const &shadowNode) {
  for (auto const &sharedChildShadowNode : shadowNode.getChildren()) {
    auto &childShadowNode = *sharedChildShadowNode;
    auto shadowView = ShadowView(childShadowNode);
    if (shadowView.layoutMetrics != EmptyLayoutMetrics) {
      shadowView.layoutMetrics.frame.origin += layoutOffset;
    }

    if (childShadowNode.getTraits().check(
            ShadowNodeTraits::Trait::FormsStackingContext)) {
      pairList.push_back({shadowView, &childShadowNode});
    } else {
      if (childShadowNode.getTraits().check(
              ShadowNodeTraits::Trait::FormsView)) {
        pairList.push_back({shadowView, &childShadowNode});
      }

      sliceChildShadowNodeViewPairsRecursively(
          pairList, shadowView.layoutMetrics.frame.origin, childShadowNode);
    }
  }
}

ShadowViewNodePair::List sliceChildShadowNodeViewPairs(
    ShadowNode const &shadowNode) {
  auto pairList = ShadowViewNodePair::List{};

  if (!shadowNode.getTraits().check(
          ShadowNodeTraits::Trait::FormsStackingContext) &&
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView)) {
    return pairList;
  }

  sliceChildShadowNodeViewPairsRecursively(pairList, {0, 0}, shadowNode);

  return pairList;
}

/*
 * Before we start to diff, let's make sure all our core data structures are in
 * good shape to deliver the best performance.
 */
static_assert(
    std::is_move_constructible<ShadowViewMutation>::value,
    "`ShadowViewMutation` must be `move constructible`.");
static_assert(
    std::is_move_constructible<ShadowView>::value,
    "`ShadowView` must be `move constructible`.");
static_assert(
    std::is_move_constructible<ShadowViewNodePair>::value,
    "`ShadowViewNodePair` must be `move constructible`.");
static_assert(
    std::is_move_constructible<ShadowViewNodePair::List>::value,
    "`ShadowViewNodePair::List` must be `move constructible`.");

static_assert(
    std::is_move_assignable<ShadowViewMutation>::value,
    "`ShadowViewMutation` must be `move assignable`.");
static_assert(
    std::is_move_assignable<ShadowView>::value,
    "`ShadowView` must be `move assignable`.");
static_assert(
    std::is_move_assignable<ShadowViewNodePair>::value,
    "`ShadowViewNodePair` must be `move assignable`.");
static_assert(
    std::is_move_assignable<ShadowViewNodePair::List>::value,
    "`ShadowViewNodePair::List` must be `move assignable`.");

static void calculateShadowViewMutationsClassic(
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::List &&oldChildPairs,
    ShadowViewNodePair::List &&newChildPairs) {
  // This version of the algorithm is optimized for simplicity,
  // not for performance or optimal result.

  if (oldChildPairs.size() == 0 && newChildPairs.size() == 0) {
    return;
  }

  // Sorting pairs based on `orderIndex` if needed.
  reorderInPlaceIfNeeded(oldChildPairs);
  reorderInPlaceIfNeeded(newChildPairs);

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

    auto oldGrandChildPairs =
        sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
    auto newGrandChildPairs =
        sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
    calculateShadowViewMutationsClassic(
        *(newGrandChildPairs.size() ? &downwardMutations
                                    : &destructiveDownwardMutations),
        oldChildPair.shadowView,
        std::move(oldGrandChildPairs),
        std::move(newGrandChildPairs));
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
      calculateShadowViewMutationsClassic(
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
        auto oldGrandChildPairs =
            sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
        auto newGrandChildPairs =
            sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
        calculateShadowViewMutationsClassic(
            *(newGrandChildPairs.size() ? &downwardMutations
                                        : &destructiveDownwardMutations),
            newChildPair.shadowView,
            std::move(oldGrandChildPairs),
            std::move(newGrandChildPairs));
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

    calculateShadowViewMutationsClassic(
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

static void calculateShadowViewMutationsOptimizedMoves(
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::List &&oldChildPairs,
    ShadowViewNodePair::List &&newChildPairs) {
  if (oldChildPairs.size() == 0 && newChildPairs.size() == 0) {
    return;
  }

  // Sorting pairs based on `orderIndex` if needed.
  reorderInPlaceIfNeeded(oldChildPairs);
  reorderInPlaceIfNeeded(newChildPairs);

  auto index = int{0};

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

    auto oldGrandChildPairs =
        sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
    auto newGrandChildPairs =
        sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
    calculateShadowViewMutationsOptimizedMoves(
        *(newGrandChildPairs.size() ? &downwardMutations
                                    : &destructiveDownwardMutations),
        oldChildPair.shadowView,
        std::move(oldGrandChildPairs),
        std::move(newGrandChildPairs));
  }

  int lastIndexAfterFirstStage = index;

  if (index == newChildPairs.size()) {
    // We've reached the end of the new children. We can delete+remove the
    // rest.
    for (; index < oldChildPairs.size(); index++) {
      auto const &oldChildPair = oldChildPairs[index];

      deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));
      removeMutations.push_back(ShadowViewMutation::RemoveMutation(
          parentShadowView, oldChildPair.shadowView, index));

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed view.
      calculateShadowViewMutationsOptimizedMoves(
          destructiveDownwardMutations,
          oldChildPair.shadowView,
          sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode),
          {});
    }
  } else if (index == oldChildPairs.size()) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be create+insert.
    for (; index < newChildPairs.size(); index++) {
      auto const &newChildPair = newChildPairs[index];

      insertMutations.push_back(ShadowViewMutation::InsertMutation(
          parentShadowView, newChildPair.shadowView, index));
      createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      calculateShadowViewMutationsOptimizedMoves(
          downwardMutations,
          newChildPair.shadowView,
          {},
          sliceChildShadowNodeViewPairs(*newChildPair.shadowNode));
    }
  } else {
    // Collect map of tags in the new list
    // In the future it would be nice to use TinyMap for newInsertedPairs, but
    // it's challenging to build an iterator that will work for our use-case
    // here.
    auto newRemainingPairs = TinyMap<Tag, ShadowViewNodePair const *>{};
    auto newInsertedPairs = TinyMap<Tag, ShadowViewNodePair const *>{};
    for (; index < newChildPairs.size(); index++) {
      auto const &newChildPair = newChildPairs[index];
      newRemainingPairs.insert({newChildPair.shadowView.tag, &newChildPair});
    }

    // Walk through both lists at the same time
    // We will perform updates, create+insert, remove+delete, remove+insert
    // (move) here.
    int oldIndex = lastIndexAfterFirstStage,
        newIndex = lastIndexAfterFirstStage, newSize = newChildPairs.size(),
        oldSize = oldChildPairs.size();
    while (newIndex < newSize || oldIndex < oldSize) {
      bool haveNewPair = newIndex < newSize;
      bool haveOldPair = oldIndex < oldSize;

      // Advance both pointers if pointing to the same element
      if (haveNewPair && haveOldPair) {
        auto const &newChildPair = newChildPairs[newIndex];
        auto const &oldChildPair = oldChildPairs[oldIndex];

        int newTag = newChildPair.shadowView.tag;
        int oldTag = oldChildPair.shadowView.tag;

        if (newTag == oldTag) {
          // Generate Update instructions
          if (oldChildPair.shadowView != newChildPair.shadowView) {
            updateMutations.push_back(ShadowViewMutation::UpdateMutation(
                parentShadowView,
                oldChildPair.shadowView,
                newChildPair.shadowView,
                index));
          }

          // Remove from newRemainingPairs
          auto newRemainingPairIt = newRemainingPairs.find(oldTag);
          if (newRemainingPairIt != newRemainingPairs.end()) {
            newRemainingPairs.erase(newRemainingPairIt);
          }

          // Update subtrees
          auto oldGrandChildPairs =
              sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
          auto newGrandChildPairs =
              sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
          calculateShadowViewMutationsOptimizedMoves(
              *(newGrandChildPairs.size() ? &downwardMutations
                                          : &destructiveDownwardMutations),
              oldChildPair.shadowView,
              std::move(oldGrandChildPairs),
              std::move(newGrandChildPairs));

          newIndex++;
          oldIndex++;
          continue;
        }
      }

      if (haveOldPair) {
        auto const &oldChildPair = oldChildPairs[oldIndex];
        int oldTag = oldChildPair.shadowView.tag;

        // Was oldTag already inserted? This indicates a reordering, not just
        // a move. The new node has already been inserted, we just need to
        // remove the node from its old position now.
        auto const insertedIt = newInsertedPairs.find(oldTag);
        if (insertedIt != newInsertedPairs.end()) {
          removeMutations.push_back(ShadowViewMutation::RemoveMutation(
              parentShadowView, oldChildPair.shadowView, oldIndex));

          // Generate update instruction since we have an iterator ref to the
          // new node
          auto const &newChildPair = *insertedIt->second;
          if (oldChildPair.shadowView != newChildPair.shadowView) {
            updateMutations.push_back(ShadowViewMutation::UpdateMutation(
                parentShadowView,
                oldChildPair.shadowView,
                newChildPair.shadowView,
                index));
          }

          // Update subtrees
          auto oldGrandChildPairs =
              sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
          auto newGrandChildPairs =
              sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
          calculateShadowViewMutationsOptimizedMoves(
              *(newGrandChildPairs.size() ? &downwardMutations
                                          : &destructiveDownwardMutations),
              oldChildPair.shadowView,
              std::move(oldGrandChildPairs),
              std::move(newGrandChildPairs));

          newInsertedPairs.erase(insertedIt);
          oldIndex++;
          continue;
        }

        // Should we generate a delete+remove instruction for the old node?
        // If there's an old node and it's not found in the "new" list, we
        // generate remove+delete for this node and its subtree.
        auto const newIt = newRemainingPairs.find(oldTag);
        if (newIt == newRemainingPairs.end()) {
          removeMutations.push_back(ShadowViewMutation::RemoveMutation(
              parentShadowView, oldChildPair.shadowView, oldIndex));
          deleteMutations.push_back(
              ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));

          // We also have to call the algorithm recursively to clean up the
          // entire subtree starting from the removed view.
          calculateShadowViewMutationsOptimizedMoves(
              destructiveDownwardMutations,
              oldChildPair.shadowView,
              sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode),
              {});

          oldIndex++;
          continue;
        }
      }

      // At this point, oldTag is -1 or is in the new list, and hasn't been
      // inserted or matched yet We're not sure yet if the new node is in the
      // old list - generate an insert instruction for the new node.
      auto const &newChildPair = newChildPairs[newIndex];
      insertMutations.push_back(ShadowViewMutation::InsertMutation(
          parentShadowView, newChildPair.shadowView, newIndex));
      newInsertedPairs.insert({newChildPair.shadowView.tag, &newChildPair});
      newIndex++;
    }

    // Final step: generate Create instructions for new nodes
    for (auto it = newInsertedPairs.begin(); it != newInsertedPairs.end();
         it++) {
      auto const &newChildPair = *it->second;
      createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      calculateShadowViewMutationsOptimizedMoves(
          downwardMutations,
          newChildPair.shadowView,
          {},
          sliceChildShadowNodeViewPairs(*newChildPair.shadowNode));
    }
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
    DifferentiatorMode differentiatorMode,
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

  if (differentiatorMode == DifferentiatorMode::Classic) {
    calculateShadowViewMutationsClassic(
        mutations,
        ShadowView(oldRootShadowNode),
        sliceChildShadowNodeViewPairs(oldRootShadowNode),
        sliceChildShadowNodeViewPairs(newRootShadowNode));
  } else {
    calculateShadowViewMutationsOptimizedMoves(
        mutations,
        ShadowView(oldRootShadowNode),
        sliceChildShadowNodeViewPairs(oldRootShadowNode),
        sliceChildShadowNodeViewPairs(newRootShadowNode));
  }

  return mutations;
}

} // namespace react
} // namespace facebook
