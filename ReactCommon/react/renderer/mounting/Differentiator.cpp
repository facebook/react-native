/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Differentiator.h"

#include <butter/map.h>
#include <butter/small_vector.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/debug/SystraceSection.h>
#include <algorithm>
#include "ShadowView.h"

#ifdef DEBUG_LOGS_DIFFER
#include <glog/logging.h>
#define DEBUG_LOGS_BREADCRUMBS 1
#define DEBUG_LOGS(code) code
#else
#define DEBUG_LOGS(code)
#endif

#ifdef DEBUG_LOGS_BREADCRUMBS
#define BREADCRUMB_TYPE std::string
#define DIFF_BREADCRUMB(X) (breadcrumb + " - " + std::string(X))
#define CREATE_DIFF_BREADCRUMB(X) std::to_string(X)
#else

enum class NoBreadcrumb {};

#define BREADCRUMB_TYPE NoBreadcrumb const &
#define DIFF_BREADCRUMB(X) \
  {}
#define CREATE_DIFF_BREADCRUMB(X) \
  {}
#endif

namespace facebook::react {

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

    Iterator it = begin_();

    if (it != nullptr) {
      return it + erasedAtFront_;
    }

    return nullptr;
  }

  inline Iterator end() {
    // `back()` asserts on the vector being non-empty
    if (vector_.empty() || numErased_ == vector_.size()) {
      return nullptr;
    }

    return &vector_.back() + 1;
  }

  inline Iterator find(KeyT key) {
    cleanVector();

    react_native_assert(key != 0);

    if (begin_() == nullptr) {
      return end();
    }

    for (auto it = begin_() + erasedAtFront_; it != end(); it++) {
      if (it->first == key) {
        return it;
      }
    }

    return end();
  }

  inline void insert(Pair pair) {
    react_native_assert(pair.first != 0);
    vector_.push_back(pair);
  }

  inline void erase(Iterator iterator) {
    // Invalidate tag.
    iterator->first = 0;

    if (iterator == begin_() + erasedAtFront_) {
      erasedAtFront_++;
    }

    numErased_++;
  }

 private:
  /**
   * Same as begin() but doesn't call cleanVector at the beginning.
   */
  inline Iterator begin_() {
    // `front()` asserts on the vector being non-empty
    if (vector_.empty() || vector_.size() == numErased_) {
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
    if ((numErased_ < (vector_.size() / 2) && !forceClean) || vector_.empty() ||
        numErased_ == 0 || numErased_ == erasedAtFront_) {
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

  butter::small_vector<Pair, DefaultSize> vector_;
  size_t numErased_{0};
  size_t erasedAtFront_{0};
};

/*
 * Sorting comparator for `reorderInPlaceIfNeeded`.
 */
static bool shouldFirstPairComesBeforeSecondOne(
    ShadowViewNodePair const *lhs,
    ShadowViewNodePair const *rhs) noexcept {
  return lhs->shadowNode->getOrderIndex() < rhs->shadowNode->getOrderIndex();
}

/*
 * Reorders pairs in-place based on `orderIndex` using a stable sort algorithm.
 */
static void reorderInPlaceIfNeeded(
    ShadowViewNodePair::NonOwningList &pairs) noexcept {
  if (pairs.size() < 2) {
    return;
  }

  auto isReorderNeeded = false;
  for (auto const &pair : pairs) {
    if (pair->shadowNode->getOrderIndex() != 0) {
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

static inline bool shadowNodeIsConcrete(ShadowNode const &shadowNode) {
  return shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView);
}

static void sliceChildShadowNodeViewPairsRecursivelyV2(
    ShadowViewNodePair::NonOwningList &pairList,
    ViewNodePairScope &scope,
    Point layoutOffset,
    ShadowNode const &shadowNode) {
  for (auto const &sharedChildShadowNode : shadowNode.getChildren()) {
    auto &childShadowNode = *sharedChildShadowNode;

#ifndef ANDROID
    // Temporary disabled on Android because the mounting infrastructure
    // is not fully ready yet.
    if (childShadowNode.getTraits().check(ShadowNodeTraits::Trait::Hidden)) {
      continue;
    }
#endif

    auto shadowView = ShadowView(childShadowNode);
    auto origin = layoutOffset;
    if (shadowView.layoutMetrics != EmptyLayoutMetrics) {
      origin += shadowView.layoutMetrics.frame.origin;
      shadowView.layoutMetrics.frame.origin += layoutOffset;
    }

    // This might not be a FormsView, or a FormsStackingContext. We let the
    // differ handle removal of flattened views from the Mounting layer and
    // shuffling their children around.
    bool isConcreteView = shadowNodeIsConcrete(childShadowNode);
    bool areChildrenFlattened = !childShadowNode.getTraits().check(
        ShadowNodeTraits::Trait::FormsStackingContext);
    Point storedOrigin = {};
    if (areChildrenFlattened) {
      storedOrigin = origin;
    }
    scope.push_back(
        {shadowView,
         &childShadowNode,
         areChildrenFlattened,
         isConcreteView,
         storedOrigin});
    pairList.push_back(&scope.back());

    if (areChildrenFlattened) {
      sliceChildShadowNodeViewPairsRecursivelyV2(
          pairList, scope, origin, childShadowNode);
    }
  }
}

ShadowViewNodePair::NonOwningList sliceChildShadowNodeViewPairsV2(
    ShadowNode const &shadowNode,
    ViewNodePairScope &scope,
    bool allowFlattened,
    Point layoutOffset) {
  auto pairList = ShadowViewNodePair::NonOwningList{};

  if (!shadowNode.getTraits().check(
          ShadowNodeTraits::Trait::FormsStackingContext) &&
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView) &&
      !allowFlattened) {
    return pairList;
  }

  sliceChildShadowNodeViewPairsRecursivelyV2(
      pairList, scope, layoutOffset, shadowNode);

  // Sorting pairs based on `orderIndex` if needed.
  reorderInPlaceIfNeeded(pairList);

  // Set list and mountIndex for each after reordering
  size_t mountIndex = 0;
  for (auto child : pairList) {
    child->mountIndex = (child->isConcreteView ? mountIndex++ : -1);
  }

  return pairList;
}

/**
 * Prefer calling this over `sliceChildShadowNodeViewPairsV2` directly, when
 * possible. This can account for adding parent LayoutMetrics that are
 * important to take into account, but tricky, in (un)flattening cases.
 */
static ShadowViewNodePair::NonOwningList
sliceChildShadowNodeViewPairsFromViewNodePair(
    ShadowViewNodePair const &shadowViewNodePair,
    ViewNodePairScope &scope,
    bool allowFlattened = false) {
  return sliceChildShadowNodeViewPairsV2(
      *shadowViewNodePair.shadowNode,
      scope,
      allowFlattened,
      shadowViewNodePair.contextOrigin);
}

/*
 * Before we start to diff, let's make sure all our core data structures are
 * in good shape to deliver the best performance.
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
    std::is_move_constructible<ShadowViewNodePair::NonOwningList>::value,
    "`ShadowViewNodePair::NonOwningList` must be `move constructible`.");

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
    std::is_move_assignable<ShadowViewNodePair::NonOwningList>::value,
    "`ShadowViewNodePair::NonOwningList` must be `move assignable`.");

static void calculateShadowViewMutationsV2(
    ViewNodePairScope &scope,
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::NonOwningList &&oldChildPairs,
    ShadowViewNodePair::NonOwningList &&newChildPairs,
    bool isRecursionRedundant = false);

struct OrderedMutationInstructionContainer {
  ShadowViewMutation::List createMutations{};
  ShadowViewMutation::List deleteMutations{};
  ShadowViewMutation::List insertMutations{};
  ShadowViewMutation::List removeMutations{};
  ShadowViewMutation::List updateMutations{};
  ShadowViewMutation::List downwardMutations{};
  ShadowViewMutation::List destructiveDownwardMutations{};
};

static void updateMatchedPairSubtrees(
    ViewNodePairScope &scope,
    OrderedMutationInstructionContainer &mutationContainer,
    TinyMap<Tag, ShadowViewNodePair *> &newRemainingPairs,
    ShadowViewNodePair::NonOwningList &oldChildPairs,
    ShadowView const &parentShadowView,
    ShadowViewNodePair const &oldPair,
    ShadowViewNodePair const &newPair);

static void updateMatchedPair(
    OrderedMutationInstructionContainer &mutationContainer,
    bool oldNodeFoundInOrder,
    bool newNodeFoundInOrder,
    ShadowView const &parentShadowView,
    ShadowViewNodePair const &oldPair,
    ShadowViewNodePair const &newPair);

static void calculateShadowViewMutationsFlattener(
    ViewNodePairScope &scope,
    ReparentMode reparentMode,
    OrderedMutationInstructionContainer &mutationContainer,
    ShadowView const &parentShadowView,
    TinyMap<Tag, ShadowViewNodePair *> &unvisitedOtherNodes,
    ShadowViewNodePair const &node,
    TinyMap<Tag, ShadowViewNodePair *> *parentSubVisitedOtherNewNodes = nullptr,
    TinyMap<Tag, ShadowViewNodePair *> *parentSubVisitedOtherOldNodes =
        nullptr);

/**
 * Updates the subtrees of any matched ShadowViewNodePair. This handles
 * all cases of flattening/unflattening.
 *
 * This may modify data-structures passed to it and owned by the caller,
 * specifically `newRemainingPairs`, and so the caller must also own
 * the ViewNodePairScope used within.
 */
static void updateMatchedPairSubtrees(
    ViewNodePairScope &scope,
    OrderedMutationInstructionContainer &mutationContainer,
    TinyMap<Tag, ShadowViewNodePair *> &newRemainingPairs,
    ShadowViewNodePair::NonOwningList &oldChildPairs,
    ShadowView const &parentShadowView,
    ShadowViewNodePair const &oldPair,
    ShadowViewNodePair const &newPair) {
  // Are we flattening or unflattening either one? If node was
  // flattened in both trees, there's no change, just continue.
  if (oldPair.flattened && newPair.flattened) {
    return;
  }

  // We are either flattening or unflattening this node.
  if (oldPair.flattened != newPair.flattened) {
    DEBUG_LOGS({
      LOG(ERROR)
          << "Differ: flattening or unflattening in updateMatchedPairSubtrees: ["
          << oldPair.shadowView.tag << "] [" << newPair.shadowView.tag << "] "
          << oldPair.flattened << " " << newPair.flattened << " with parent: ["
          << parentShadowView.tag << "]";
    });

    // Flattening
    if (!oldPair.flattened) {
      // Flatten old tree into new list
      // At the end of this loop we still want to know which of these
      // children are visited, so we reuse the `newRemainingPairs`
      // map.
      calculateShadowViewMutationsFlattener(
          scope,
          ReparentMode::Flatten,
          mutationContainer,
          parentShadowView,
          newRemainingPairs,
          oldPair);
    }
    // Unflattening
    else {
      // Construct unvisited nodes map
      auto unvisitedOldChildPairs = TinyMap<Tag, ShadowViewNodePair *>{};
      // We don't know where all the children of oldChildPair are
      // within oldChildPairs, but we know that they're in the same
      // relative order. The reason for this is because of flattening
      // + zIndex: the children could be listed before the parent,
      // interwoven with children from other nodes, etc.
      auto oldFlattenedNodes =
          sliceChildShadowNodeViewPairsFromViewNodePair(oldPair, scope, true);
      for (size_t i = 0, j = 0;
           i < oldChildPairs.size() && j < oldFlattenedNodes.size();
           i++) {
        auto &oldChild = *oldChildPairs[i];
        if (oldChild.shadowView.tag == oldFlattenedNodes[j]->shadowView.tag) {
          unvisitedOldChildPairs.insert({oldChild.shadowView.tag, &oldChild});
          j++;
        }
      }

      // Unflatten old list into new tree
      calculateShadowViewMutationsFlattener(
          scope,
          ReparentMode::Unflatten,
          mutationContainer,
          parentShadowView,
          unvisitedOldChildPairs,
          newPair);

      // If old nodes were not visited, we know that we can delete
      // them now. They will be removed from the hierarchy by the
      // outermost loop of this function.
      // TODO: is this necessary anymore?
      for (auto &oldFlattenedNodePtr : oldFlattenedNodes) {
        auto &oldFlattenedNode = *oldFlattenedNodePtr;
        auto unvisitedOldChildPairIt =
            unvisitedOldChildPairs.find(oldFlattenedNode.shadowView.tag);
        if (unvisitedOldChildPairIt == unvisitedOldChildPairs.end()) {
          // Node was visited - make sure to remove it from
          // "newRemainingPairs" map
          auto newRemainingIt =
              newRemainingPairs.find(oldFlattenedNode.shadowView.tag);
          if (newRemainingIt != newRemainingPairs.end()) {
            newRemainingPairs.erase(newRemainingIt);
          }
        }
      }
    }

    return;
  }

  // Update subtrees if View is not flattened, and if node addresses
  // are not equal
  if (oldPair.shadowNode != newPair.shadowNode) {
    ViewNodePairScope innerScope{};
    auto oldGrandChildPairs =
        sliceChildShadowNodeViewPairsFromViewNodePair(oldPair, innerScope);
    auto newGrandChildPairs =
        sliceChildShadowNodeViewPairsFromViewNodePair(newPair, innerScope);
    calculateShadowViewMutationsV2(
        innerScope,
        *(newGrandChildPairs.size()
              ? &mutationContainer.downwardMutations
              : &mutationContainer.destructiveDownwardMutations),
        oldPair.shadowView,
        std::move(oldGrandChildPairs),
        std::move(newGrandChildPairs));
  }
}

/**
 * Handle updates to a matched node pair, but NOT to their subtrees.
 *
 * Here we have (and need) knowledge of whether a node was found during
 * in-order traversal, or out-of-order via a map lookup. Nodes are only REMOVEd
 * or INSERTed when they are encountered via in-order-traversal, to ensure
 * correct ordering of INSERT and REMOVE mutations.
 */
static void updateMatchedPair(
    OrderedMutationInstructionContainer &mutationContainer,
    bool oldNodeFoundInOrder,
    bool newNodeFoundInOrder,
    ShadowView const &parentShadowView,
    ShadowViewNodePair const &oldPair,
    ShadowViewNodePair const &newPair) {
  oldPair.otherTreePair = &newPair;
  newPair.otherTreePair = &oldPair;

  // Check concrete-ness of views
  // Create/Delete and Insert/Remove if necessary
  if (oldPair.isConcreteView != newPair.isConcreteView) {
    if (newPair.isConcreteView) {
      if (newNodeFoundInOrder) {
        mutationContainer.insertMutations.push_back(
            ShadowViewMutation::InsertMutation(
                parentShadowView,
                newPair.shadowView,
                static_cast<int>(newPair.mountIndex)));
      }
      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(newPair.shadowView));
    } else {
      if (oldNodeFoundInOrder) {
        mutationContainer.removeMutations.push_back(
            ShadowViewMutation::RemoveMutation(
                parentShadowView,
                oldPair.shadowView,
                static_cast<int>(oldPair.mountIndex)));
      }
      mutationContainer.deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldPair.shadowView));
    }
  } else if (oldPair.isConcreteView && newPair.isConcreteView) {
    // If we found the old node by traversing, but not the new node,
    // it means that there's some reordering requiring a REMOVE mutation.
    if (oldNodeFoundInOrder && !newNodeFoundInOrder) {
      mutationContainer.removeMutations.push_back(
          ShadowViewMutation::RemoveMutation(
              parentShadowView,
              newPair.shadowView,
              static_cast<int>(oldPair.mountIndex)));
    }

    // Even if node's children are flattened, it might still be a
    // concrete view. The case where they're different is handled
    // above.
    if (oldPair.shadowView != newPair.shadowView) {
      mutationContainer.updateMutations.push_back(
          ShadowViewMutation::UpdateMutation(
              oldPair.shadowView, newPair.shadowView, parentShadowView));
    }
  }
}

/**
 * Here we flatten or unflatten a subtree, given an unflattened node in either
 * the old or new tree, and a list of flattened nodes in the other tree.
 *
 * For example: if you are Flattening, the node will be in the old tree and
 the
 * list will be from the new tree. If you are Unflattening, the opposite is
 true.

 * It is currently not possible for ReactJS, and therefore React Native, to
 move
 * a node *from* one parent to another without an entirely new subtree being
 * created. When we "reparent" in React Native here it is only because
 intermediate
 * ShadowNodes/ShadowViews, which *always* exist, are flattened or unflattened
 away.
 * Thus, this algorithm handles the very specialized cases of the tree
 collapsing or
 * expanding vertically in that way.

 * Sketch of algorithm:
 * 0. Create a map of nodes in the flattened list. This should be done
 *before*
 *    calling this function.
 * 1. Traverse the Node Subtree; remove elements from the map as they are
 *    visited in the tree.
 *    Perform a Remove/Insert depending on if we're flattening or unflattening
 *    If Tree node is not in Map/List, perform Delete/Create.
 * 2. Traverse the list.
 *    Perform linear remove from the old View, or insert into the new parent
 *    View if we're flattening.
 *    If a node is in the list but not the map, it means it's been visited and
 *    Update has already been
 *    performed in the subtree. If it *is* in the map, it means the node is
 not
 *    * in the Tree, and should be Deleted/Created
 *    **after this function is called**, by the caller.
 */
static void calculateShadowViewMutationsFlattener(
    ViewNodePairScope &scope,
    ReparentMode reparentMode,
    OrderedMutationInstructionContainer &mutationContainer,
    ShadowView const &parentShadowView,
    TinyMap<Tag, ShadowViewNodePair *> &unvisitedOtherNodes,
    ShadowViewNodePair const &node,
    TinyMap<Tag, ShadowViewNodePair *> *parentSubVisitedOtherNewNodes,
    TinyMap<Tag, ShadowViewNodePair *> *parentSubVisitedOtherOldNodes) {
  DEBUG_LOGS({
    LOG(ERROR) << "Differ Flattener 1: "
               << (reparentMode == ReparentMode::Unflatten ? "Unflattening"
                                                           : "Flattening")
               << " [" << node.shadowView.tag << "]";
  });

  // Step 1: iterate through entire tree
  ShadowViewNodePair::NonOwningList treeChildren =
      sliceChildShadowNodeViewPairsFromViewNodePair(node, scope);

  DEBUG_LOGS({
    LOG(ERROR) << "Differ Flattener 1.4: "
               << (reparentMode == ReparentMode::Unflatten ? "Unflattening"
                                                           : "Flattening")
               << " [" << node.shadowView.tag << "]";
    LOG(ERROR) << "Differ Flattener Entry: Child Pairs: ";
    std::string strTreeChildPairs;
    for (size_t k = 0; k < treeChildren.size(); k++) {
      strTreeChildPairs.append(std::to_string(treeChildren[k]->shadowView.tag));
      strTreeChildPairs.append(treeChildren[k]->isConcreteView ? "" : "'");
      strTreeChildPairs.append(treeChildren[k]->flattened ? "*" : "");
      strTreeChildPairs.append(", ");
    }
    std::string strListChildPairs;
    for (auto &unvisitedNode : unvisitedOtherNodes) {
      strListChildPairs.append(
          std::to_string(unvisitedNode.second->shadowView.tag));
      strListChildPairs.append(unvisitedNode.second->isConcreteView ? "" : "'");
      strListChildPairs.append(unvisitedNode.second->flattened ? "*" : "");
      strListChildPairs.append(", ");
    }
    LOG(ERROR) << "Differ Flattener Entry: Tree Child Pairs: "
               << strTreeChildPairs;
    LOG(ERROR) << "Differ Flattener Entry: List Child Pairs: "
               << strListChildPairs;
  });

  // Views in other tree that are visited by sub-flattening or
  // sub-unflattening
  TinyMap<Tag, ShadowViewNodePair *> subVisitedOtherNewNodes{};
  TinyMap<Tag, ShadowViewNodePair *> subVisitedOtherOldNodes{};
  auto subVisitedNewMap =
      (parentSubVisitedOtherNewNodes != nullptr ? parentSubVisitedOtherNewNodes
                                                : &subVisitedOtherNewNodes);
  auto subVisitedOldMap =
      (parentSubVisitedOtherOldNodes != nullptr ? parentSubVisitedOtherOldNodes
                                                : &subVisitedOtherOldNodes);

  // Candidates for full tree creation or deletion at the end of this function
  auto deletionCreationCandidatePairs =
      TinyMap<Tag, ShadowViewNodePair const *>{};

  for (size_t index = 0;
       index < treeChildren.size() && index < treeChildren.size();
       index++) {
    auto &treeChildPair = *treeChildren[index];

    // Try to find node in other tree
    auto unvisitedIt = unvisitedOtherNodes.find(treeChildPair.shadowView.tag);
    auto subVisitedOtherNewIt =
        (unvisitedIt == unvisitedOtherNodes.end()
             ? subVisitedNewMap->find(treeChildPair.shadowView.tag)
             : subVisitedNewMap->end());
    auto subVisitedOtherOldIt =
        (unvisitedIt == unvisitedOtherNodes.end() && subVisitedNewMap->end()
             ? subVisitedOldMap->find(treeChildPair.shadowView.tag)
             : subVisitedOldMap->end());

    bool existsInOtherTree = unvisitedIt != unvisitedOtherNodes.end() ||
        subVisitedOtherNewIt != subVisitedNewMap->end() ||
        subVisitedOtherOldIt != subVisitedOldMap->end();

    auto otherTreeNodePairPtr =
        (existsInOtherTree
             ? (unvisitedIt != unvisitedOtherNodes.end()
                    ? unvisitedIt->second
                    : (subVisitedOtherNewIt != subVisitedNewMap->end()
                           ? subVisitedOtherNewIt->second
                           : subVisitedOtherOldIt->second))
             : nullptr);

    react_native_assert(
        !existsInOtherTree ||
        (unvisitedIt != unvisitedOtherNodes.end() ||
         subVisitedOtherNewIt != subVisitedNewMap->end() ||
         subVisitedOtherOldIt != subVisitedOldMap->end()));
    react_native_assert(
        unvisitedIt == unvisitedOtherNodes.end() ||
        unvisitedIt->second->shadowView.tag == treeChildPair.shadowView.tag);
    react_native_assert(
        subVisitedOtherNewIt == subVisitedNewMap->end() ||
        subVisitedOtherNewIt->second->shadowView.tag ==
            treeChildPair.shadowView.tag);
    react_native_assert(
        subVisitedOtherOldIt == subVisitedOldMap->end() ||
        subVisitedOtherOldIt->second->shadowView.tag ==
            treeChildPair.shadowView.tag);

    bool alreadyUpdated = false;

    // Find in other tree and updated `otherTreePair` pointers
    if (existsInOtherTree) {
      react_native_assert(otherTreeNodePairPtr != nullptr);
      auto newTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? otherTreeNodePairPtr
                                                 : &treeChildPair);
      auto oldTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? &treeChildPair
                                                 : otherTreeNodePairPtr);

      react_native_assert(newTreeNodePair->shadowView.tag != 0);
      react_native_assert(oldTreeNodePair->shadowView.tag != 0);
      react_native_assert(
          oldTreeNodePair->shadowView.tag == newTreeNodePair->shadowView.tag);

      alreadyUpdated =
          newTreeNodePair->inOtherTree() || oldTreeNodePair->inOtherTree();

      // We want to update these values unconditionally. Always do this
      // before hitting any "continue" statements.
      newTreeNodePair->otherTreePair = oldTreeNodePair;
      oldTreeNodePair->otherTreePair = newTreeNodePair;
      react_native_assert(treeChildPair.otherTreePair != nullptr);
    }

    // Remove all children (non-recursively) of tree being flattened, or
    // insert children into parent tree if they're being unflattened.
    //  Caller will take care of the corresponding action in the other tree
    //  (caller will handle DELETE case if we REMOVE here; caller will handle
    //  CREATE case if we INSERT here).
    if (treeChildPair.isConcreteView) {
      if (reparentMode == ReparentMode::Flatten) {
        // treeChildPair.shadowView represents the "old" view in this case.
        // If there's a "new" view, an UPDATE new -> old will be generated
        // and will be executed before the REMOVE. Thus, we must actually
        // perform a REMOVE (new view) FROM (old index) in this case so that
        // we don't hit asserts in StubViewTree's REMOVE path.
        // We also only do this if the "other" (newer) view is concrete. If
        // it's not concrete, there will be no UPDATE mutation.
        react_native_assert(existsInOtherTree == treeChildPair.inOtherTree());
        if (treeChildPair.inOtherTree() &&
            treeChildPair.otherTreePair->isConcreteView) {
          mutationContainer.removeMutations.push_back(
              ShadowViewMutation::RemoveMutation(
                  node.shadowView,
                  treeChildPair.otherTreePair->shadowView,
                  static_cast<int>(treeChildPair.mountIndex)));
        } else {
          mutationContainer.removeMutations.push_back(
              ShadowViewMutation::RemoveMutation(
                  node.shadowView,
                  treeChildPair.shadowView,
                  static_cast<int>(treeChildPair.mountIndex)));
        }
      } else {
        // treeChildParent represents the "new" version of the node, so
        // we can safely insert it without checking in the other tree
        mutationContainer.insertMutations.push_back(
            ShadowViewMutation::InsertMutation(
                node.shadowView,
                treeChildPair.shadowView,
                static_cast<int>(treeChildPair.mountIndex)));
      }
    }

    // Find in other tree
    if (existsInOtherTree) {
      react_native_assert(otherTreeNodePairPtr != nullptr);
      auto &otherTreeNodePair = *otherTreeNodePairPtr;

      auto &newTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? otherTreeNodePair
                                                 : treeChildPair);
      auto &oldTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? treeChildPair
                                                 : otherTreeNodePair);

      react_native_assert(newTreeNodePair.shadowView.tag != 0);
      react_native_assert(oldTreeNodePair.shadowView.tag != 0);
      react_native_assert(
          oldTreeNodePair.shadowView.tag == newTreeNodePair.shadowView.tag);

      // If we've already done updates, don't repeat it.
      if (alreadyUpdated) {
        continue;
      }

      // If we've already done updates on this node, don't repeat.
      if (reparentMode == ReparentMode::Flatten &&
          unvisitedIt == unvisitedOtherNodes.end() &&
          subVisitedOtherOldIt != subVisitedOldMap->end()) {
        continue;
      } else if (
          reparentMode == ReparentMode::Unflatten &&
          unvisitedIt == unvisitedOtherNodes.end() &&
          subVisitedOtherNewIt != subVisitedNewMap->end()) {
        continue;
      }

      // TODO: compare ShadowNode pointer instead of ShadowView here?
      // Or ShadowNode ptr comparison before comparing ShadowView, to allow for
      // short-circuiting? ShadowView comparison is relatively expensive vs
      // ShadowNode.
      if (newTreeNodePair.shadowView != oldTreeNodePair.shadowView &&
          newTreeNodePair.isConcreteView && oldTreeNodePair.isConcreteView) {
        mutationContainer.updateMutations.push_back(
            ShadowViewMutation::UpdateMutation(
                oldTreeNodePair.shadowView,
                newTreeNodePair.shadowView,
                node.shadowView));
      }

      // Update children if appropriate.
      if (!oldTreeNodePair.flattened && !newTreeNodePair.flattened) {
        if (oldTreeNodePair.shadowNode != newTreeNodePair.shadowNode) {
          ViewNodePairScope innerScope{};
          calculateShadowViewMutationsV2(
              innerScope,
              mutationContainer.downwardMutations,
              newTreeNodePair.shadowView,
              sliceChildShadowNodeViewPairsFromViewNodePair(
                  oldTreeNodePair, innerScope),
              sliceChildShadowNodeViewPairsFromViewNodePair(
                  newTreeNodePair, innerScope));
        }
      } else if (oldTreeNodePair.flattened != newTreeNodePair.flattened) {
        // We need to handle one of the children being flattened or
        // unflattened, in the context of a parent flattening or unflattening.
        ReparentMode childReparentMode =
            (oldTreeNodePair.flattened ? ReparentMode::Unflatten
                                       : ReparentMode::Flatten);

        // Case 1: child mode is the same as parent.
        // This is a flatten-flatten, or unflatten-unflatten.
        if (childReparentMode == reparentMode) {
          calculateShadowViewMutationsFlattener(
              scope,
              childReparentMode,
              mutationContainer,
              (reparentMode == ReparentMode::Flatten
                   ? parentShadowView
                   : newTreeNodePair.shadowView),
              unvisitedOtherNodes,
              treeChildPair,
              subVisitedNewMap,
              subVisitedOldMap);
        } else {
          // Get flattened nodes from either new or old tree
          auto flattenedNodes = sliceChildShadowNodeViewPairsFromViewNodePair(
              (childReparentMode == ReparentMode::Flatten ? newTreeNodePair
                                                          : oldTreeNodePair),
              scope,
              true);
          // Construct unvisited nodes map
          auto unvisitedRecursiveChildPairs =
              TinyMap<Tag, ShadowViewNodePair *>{};
          for (auto &flattenedNode : flattenedNodes) {
            auto &newChild = *flattenedNode;

            auto unvisitedOtherNodesIt =
                unvisitedOtherNodes.find(newChild.shadowView.tag);
            if (unvisitedOtherNodesIt != unvisitedOtherNodes.end()) {
              auto unvisitedItPair = *unvisitedOtherNodesIt->second;
              unvisitedRecursiveChildPairs.insert(
                  {unvisitedItPair.shadowView.tag, &unvisitedItPair});
            } else {
              unvisitedRecursiveChildPairs.insert(
                  {newChild.shadowView.tag, &newChild});
            }
          }

          // Unflatten parent, flatten child
          if (childReparentMode == ReparentMode::Flatten) {
            // Flatten old tree into new list
            // At the end of this loop we still want to know which of these
            // children are visited, so we reuse the `newRemainingPairs` map.
            calculateShadowViewMutationsFlattener(
                scope,
                ReparentMode::Flatten,
                mutationContainer,
                (reparentMode == ReparentMode::Flatten
                     ? parentShadowView
                     : newTreeNodePair.shadowView),
                unvisitedRecursiveChildPairs,
                oldTreeNodePair,
                subVisitedNewMap,
                subVisitedOldMap);
          }
          // Flatten parent, unflatten child
          else {
            // Unflatten old list into new tree
            calculateShadowViewMutationsFlattener(
                scope,
                ReparentMode::Unflatten,
                mutationContainer,
                (reparentMode == ReparentMode::Flatten
                     ? parentShadowView
                     : newTreeNodePair.shadowView),
                unvisitedRecursiveChildPairs,
                newTreeNodePair,
                subVisitedNewMap,
                subVisitedOldMap);

            // If old nodes were not visited, we know that we can delete them
            // now. They will be removed from the hierarchy by the outermost
            // loop of this function.
            for (auto &unvisitedRecursiveChildPair :
                 unvisitedRecursiveChildPairs) {
              if (unvisitedRecursiveChildPair.first == 0) {
                continue;
              }
              auto &oldFlattenedNode = *unvisitedRecursiveChildPair.second;

              // Node unvisited - mark the entire subtree for deletion
              if (oldFlattenedNode.isConcreteView &&
                  !oldFlattenedNode.inOtherTree()) {
                Tag tag = oldFlattenedNode.shadowView.tag;
                auto deleteCreateIt = deletionCreationCandidatePairs.find(
                    oldFlattenedNode.shadowView.tag);
                if (deleteCreateIt == deletionCreationCandidatePairs.end()) {
                  deletionCreationCandidatePairs.insert(
                      {tag, &oldFlattenedNode});
                }
              } else {
                // Node was visited - make sure to remove it from
                // "newRemainingPairs" map
                auto newRemainingIt =
                    unvisitedOtherNodes.find(oldFlattenedNode.shadowView.tag);
                if (newRemainingIt != unvisitedOtherNodes.end()) {
                  unvisitedOtherNodes.erase(newRemainingIt);
                }
              }
            }
          }
        }
      }

      // Mark that node exists in another tree, but only if the tree node is a
      // concrete view. Removing the node from the unvisited list prevents the
      // caller from taking further action on this node, so make sure to
      // delete/create if the Concreteness of the node has changed.
      if (newTreeNodePair.isConcreteView != oldTreeNodePair.isConcreteView) {
        if (newTreeNodePair.isConcreteView) {
          mutationContainer.createMutations.push_back(
              ShadowViewMutation::CreateMutation(newTreeNodePair.shadowView));
        } else {
          mutationContainer.deleteMutations.push_back(
              ShadowViewMutation::DeleteMutation(oldTreeNodePair.shadowView));
        }
      }

      subVisitedNewMap->insert(
          {newTreeNodePair.shadowView.tag, &newTreeNodePair});
      subVisitedOldMap->insert(
          {oldTreeNodePair.shadowView.tag, &oldTreeNodePair});
    } else {
      // Node does not in exist in other tree.
      if (treeChildPair.isConcreteView && !treeChildPair.inOtherTree()) {
        auto deletionCreationIt =
            deletionCreationCandidatePairs.find(treeChildPair.shadowView.tag);
        if (deletionCreationIt == deletionCreationCandidatePairs.end()) {
          deletionCreationCandidatePairs.insert(
              {treeChildPair.shadowView.tag, &treeChildPair});
        }
      }
    }
  }

  // Final step: go through creation/deletion candidates and delete/create
  // subtrees if they were never visited during the execution of the above
  // loop and recursions.
  for (auto &deletionCreationCandidatePair : deletionCreationCandidatePairs) {
    if (deletionCreationCandidatePair.first == 0) {
      continue;
    }
    auto &treeChildPair = *deletionCreationCandidatePair.second;

    // If node was visited during a flattening/unflattening recursion,
    // and the node in the other tree is concrete, that means it was
    // already created/deleted and we don't need to do that here.
    // It is always the responsibility of the matcher to update subtrees when
    // nodes are matched.
    if (treeChildPair.inOtherTree()) {
      continue;
    }

    if (reparentMode == ReparentMode::Flatten) {
      mutationContainer.deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(treeChildPair.shadowView));

      if (!treeChildPair.flattened) {
        ViewNodePairScope innerScope{};
        calculateShadowViewMutationsV2(
            innerScope,
            mutationContainer.destructiveDownwardMutations,
            treeChildPair.shadowView,
            sliceChildShadowNodeViewPairsFromViewNodePair(
                treeChildPair, innerScope),
            {});
      }
    } else {
      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(treeChildPair.shadowView));

      if (!treeChildPair.flattened) {
        ViewNodePairScope innerScope{};
        calculateShadowViewMutationsV2(
            innerScope,
            mutationContainer.downwardMutations,
            treeChildPair.shadowView,
            {},
            sliceChildShadowNodeViewPairsFromViewNodePair(
                treeChildPair, innerScope));
      }
    }
  }
}

static void calculateShadowViewMutationsV2(
    ViewNodePairScope &scope,
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::NonOwningList &&oldChildPairs,
    ShadowViewNodePair::NonOwningList &&newChildPairs,
    bool isRecursionRedundant) {
  SystraceSection s("Differentiator::calculateShadowViewMutationsV2");
  if (oldChildPairs.empty() && newChildPairs.empty()) {
    return;
  }

  size_t index = 0;

  // Lists of mutations
  auto mutationContainer = OrderedMutationInstructionContainer{};

  DEBUG_LOGS({
    LOG(ERROR) << "Differ Entry: Child Pairs of node: [" << parentShadowView.tag
               << "]";
    std::string strOldChildPairs;
    for (size_t oldIndex = 0; oldIndex < oldChildPairs.size(); oldIndex++) {
      strOldChildPairs.append(
          std::to_string(oldChildPairs[oldIndex]->shadowView.tag));
      strOldChildPairs.append(
          oldChildPairs[oldIndex]->isConcreteView ? "" : "'");
      strOldChildPairs.append(oldChildPairs[oldIndex]->flattened ? "*" : "");
      strOldChildPairs.append(", ");
    }
    std::string strNewChildPairs;
    for (size_t newIndex = 0; newIndex < newChildPairs.size(); newIndex++) {
      strNewChildPairs.append(
          std::to_string(newChildPairs[newIndex]->shadowView.tag));
      strNewChildPairs.append(
          newChildPairs[newIndex]->isConcreteView ? "" : "'");
      strNewChildPairs.append(newChildPairs[newIndex]->flattened ? "*" : "");
      strNewChildPairs.append(", ");
    }
    LOG(ERROR) << "Differ Entry: Old Child Pairs: " << strOldChildPairs;
    LOG(ERROR) << "Differ Entry: New Child Pairs: " << strNewChildPairs;
  });

  // Stage 1: Collecting `Update` mutations
  for (index = 0; index < oldChildPairs.size() && index < newChildPairs.size();
       index++) {
    auto &oldChildPair = *oldChildPairs[index];
    auto &newChildPair = *newChildPairs[index];

    if (oldChildPair.shadowView.tag != newChildPair.shadowView.tag) {
      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 1.1: Tags Different: ["
                   << oldChildPair.shadowView.tag << "] ["
                   << newChildPair.shadowView.tag << "]"
                   << " with parent: [" << parentShadowView.tag << "]";
      });

      // Totally different nodes, updating is impossible.
      break;
    }

    // If either view was flattened, and that has changed this frame, don't
    // try to update
    if (oldChildPair.flattened != newChildPair.flattened ||
        oldChildPair.isConcreteView != newChildPair.isConcreteView) {
      break;
    }

    DEBUG_LOGS({
      LOG(ERROR) << "Differ Branch 1.2: Same tags, update and recurse: ["
                 << oldChildPair.shadowView.tag << "]"
                 << (oldChildPair.flattened ? " (flattened)" : "")
                 << (oldChildPair.isConcreteView ? " (concrete)" : "") << "["
                 << newChildPair.shadowView.tag << "]"
                 << (newChildPair.flattened ? " (flattened)" : "")
                 << (newChildPair.isConcreteView ? " (concrete)" : "")
                 << " with parent: [" << parentShadowView.tag << "]";
    });

    if (newChildPair.isConcreteView &&
        oldChildPair.shadowView != newChildPair.shadowView) {
      mutationContainer.updateMutations.push_back(
          ShadowViewMutation::UpdateMutation(
              oldChildPair.shadowView,
              newChildPair.shadowView,
              parentShadowView));
    }

    // Recursively update tree if ShadowNode pointers are not equal
    if (!oldChildPair.flattened &&
        oldChildPair.shadowNode != newChildPair.shadowNode) {
      ViewNodePairScope innerScope{};
      auto oldGrandChildPairs = sliceChildShadowNodeViewPairsFromViewNodePair(
          oldChildPair, innerScope);
      auto newGrandChildPairs = sliceChildShadowNodeViewPairsFromViewNodePair(
          newChildPair, innerScope);
      calculateShadowViewMutationsV2(
          innerScope,
          *(newGrandChildPairs.size()
                ? &mutationContainer.downwardMutations
                : &mutationContainer.destructiveDownwardMutations),
          oldChildPair.shadowView,
          std::move(oldGrandChildPairs),
          std::move(newGrandChildPairs));
    }
  }

  size_t lastIndexAfterFirstStage = index;

  if (index == newChildPairs.size()) {
    // We've reached the end of the new children. We can delete+remove the
    // rest.
    for (; index < oldChildPairs.size(); index++) {
      auto const &oldChildPair = *oldChildPairs[index];

      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 2: Deleting Tag/Tree: ["
                   << oldChildPair.shadowView.tag << "]"
                   << " with parent: [" << parentShadowView.tag << "]";
      });

      if (!oldChildPair.isConcreteView) {
        continue;
      }

      // If we take this path, technically the operations and recursion below
      // are redundant. However, some parts of the Fabric ecosystem (namely, as
      // of writing this, LayoutAnimations) rely heavily on getting /explicit/
      // Remove/Delete instructions for every single node in the tree. Thus, we
      // generate the "RemoveDeleteTree" instruction as well as all of the
      // individual Remove/Delete operations below, but we mark those as
      // redundant. The platform layer can then discard the unnecessary
      // instructions. RemoveDeleteTreeMutation is a significant performance
      // improvement but could be improved significantly by eliminating the need
      // for any of the redundant instructions in the future.
      if (ShadowViewMutation::PlatformSupportsRemoveDeleteTreeInstruction &&
          !isRecursionRedundant) {
        mutationContainer.removeMutations.push_back(
            ShadowViewMutation::RemoveDeleteTreeMutation(
                parentShadowView,
                oldChildPair.shadowView,
                static_cast<int>(oldChildPair.mountIndex)));
      }

      mutationContainer.deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(
              oldChildPair.shadowView,
              isRecursionRedundant ||
                  ShadowViewMutation::
                      PlatformSupportsRemoveDeleteTreeInstruction));
      mutationContainer.removeMutations.push_back(
          ShadowViewMutation::RemoveMutation(
              parentShadowView,
              oldChildPair.shadowView,
              static_cast<int>(oldChildPair.mountIndex),
              isRecursionRedundant ||
                  ShadowViewMutation::
                      PlatformSupportsRemoveDeleteTreeInstruction));

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed view.
      ViewNodePairScope innerScope{};
      calculateShadowViewMutationsV2(
          innerScope,
          mutationContainer.destructiveDownwardMutations,
          oldChildPair.shadowView,
          sliceChildShadowNodeViewPairsFromViewNodePair(
              oldChildPair, innerScope),
          {},
          ShadowViewMutation::PlatformSupportsRemoveDeleteTreeInstruction);
    }
  } else if (index == oldChildPairs.size()) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be create+insert.
    for (; index < newChildPairs.size(); index++) {
      auto const &newChildPair = *newChildPairs[index];

      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 3: Creating Tag/Tree: ["
                   << newChildPair.shadowView.tag << "]"
                   << " with parent: [" << parentShadowView.tag << "]";
      });

      if (!newChildPair.isConcreteView) {
        continue;
      }

      mutationContainer.insertMutations.push_back(
          ShadowViewMutation::InsertMutation(
              parentShadowView,
              newChildPair.shadowView,
              static_cast<int>(newChildPair.mountIndex)));
      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      ViewNodePairScope innerScope{};
      calculateShadowViewMutationsV2(
          innerScope,
          mutationContainer.downwardMutations,
          newChildPair.shadowView,
          {},
          sliceChildShadowNodeViewPairsFromViewNodePair(
              newChildPair, innerScope));
    }
  } else {
    // Collect map of tags in the new list
    auto newRemainingPairs = TinyMap<Tag, ShadowViewNodePair *>{};
    auto newInsertedPairs = TinyMap<Tag, ShadowViewNodePair *>{};
    auto deletionCandidatePairs = TinyMap<Tag, ShadowViewNodePair const *>{};
    for (; index < newChildPairs.size(); index++) {
      auto &newChildPair = *newChildPairs[index];
      newRemainingPairs.insert({newChildPair.shadowView.tag, &newChildPair});
    }

    // Walk through both lists at the same time
    // We will perform updates, create+insert, remove+delete, remove+insert
    // (move) here.
    size_t oldIndex = lastIndexAfterFirstStage;
    size_t newIndex = lastIndexAfterFirstStage;
    size_t newSize = newChildPairs.size();
    size_t oldSize = oldChildPairs.size();
    while (newIndex < newSize || oldIndex < oldSize) {
      bool haveNewPair = newIndex < newSize;
      bool haveOldPair = oldIndex < oldSize;

      // Advance both pointers if pointing to the same element
      if (haveNewPair && haveOldPair) {
        auto const &oldChildPair = *oldChildPairs[oldIndex];
        auto const &newChildPair = *newChildPairs[newIndex];

        Tag newTag = newChildPair.shadowView.tag;
        Tag oldTag = oldChildPair.shadowView.tag;

        if (newTag == oldTag) {
          DEBUG_LOGS({
            LOG(ERROR) << "Differ Branch 5: Matched Tags at indices: "
                       << oldIndex << " " << newIndex << ": ["
                       << oldChildPair.shadowView.tag << "]"
                       << (oldChildPair.flattened ? "(flattened)" : "")
                       << (oldChildPair.isConcreteView ? "(concrete)" : "")
                       << " [" << newChildPair.shadowView.tag << "]"
                       << (newChildPair.flattened ? "(flattened)" : "")
                       << (newChildPair.isConcreteView ? "(concrete)" : "")
                       << " with parent: [" << parentShadowView.tag << "]";
          });

          updateMatchedPair(
              mutationContainer,
              true,
              true,
              parentShadowView,
              oldChildPair,
              newChildPair);

          updateMatchedPairSubtrees(
              scope,
              mutationContainer,
              newRemainingPairs,
              oldChildPairs,
              parentShadowView,
              oldChildPair,
              newChildPair);

          newIndex++;
          oldIndex++;
          continue;
        }
      }

      // We have an old pair, but we either don't have any remaining new pairs
      // or we have one but it's not matched up with the old pair
      if (haveOldPair) {
        auto const &oldChildPair = *oldChildPairs[oldIndex];

        Tag oldTag = oldChildPair.shadowView.tag;

        // Was oldTag already inserted? This indicates a reordering, not just
        // a move. The new node has already been inserted, we just need to
        // remove the node from its old position now, and update the node's
        // subtree.
        auto const insertedIt = newInsertedPairs.find(oldTag);
        if (insertedIt != newInsertedPairs.end()) {
          auto const &newChildPair = *insertedIt->second;

          updateMatchedPair(
              mutationContainer,
              true,
              false,
              parentShadowView,
              oldChildPair,
              newChildPair);

          updateMatchedPairSubtrees(
              scope,
              mutationContainer,
              newRemainingPairs,
              oldChildPairs,
              parentShadowView,
              oldChildPair,
              newChildPair);

          newInsertedPairs.erase(insertedIt);
          oldIndex++;
          continue;
        }

        // Should we generate a delete+remove instruction for the old node?
        // If there's an old node and it's not found in the "new" list, we
        // generate remove+delete for this node and its subtree.
        auto const newIt = newRemainingPairs.find(oldTag);
        if (newIt == newRemainingPairs.end()) {
          oldIndex++;

          if (!oldChildPair.isConcreteView) {
            continue;
          }

          // From here, we know the oldChildPair is concrete.
          // We *probably* need to generate a REMOVE mutation (see edge-case
          // notes below).

          DEBUG_LOGS({
            LOG(ERROR)
                << "Differ Branch 9: Removing tag that was not reinserted: "
                << oldIndex << ": [" << oldChildPair.shadowView.tag << "]"
                << (oldChildPair.flattened ? " (flattened)" : "")
                << (oldChildPair.isConcreteView ? " (concrete)" : "")
                << " with parent: [" << parentShadowView.tag << "] "
                << "node is in other tree? "
                << (oldChildPair.inOtherTree() ? "yes" : "no");
          });

          // Edge case: node is not found in `newRemainingPairs`, due to
          // complex (un)flattening cases, but exists in other tree *and* is
          // concrete.
          if (oldChildPair.inOtherTree() &&
              oldChildPair.otherTreePair->isConcreteView) {
            ShadowView const &otherTreeView =
                oldChildPair.otherTreePair->shadowView;

            // Remove, but remove using the *new* node, since we know
            // an UPDATE mutation from old -> new has been generated.
            // Practically this shouldn't matter for most mounting layer
            // implementations, but helps adhere to the invariant that
            // for all mutation instructions, "oldViewShadowNode" == "current
            // node on mounting layer / stubView".
            // Here we do *not" need to generate a potential DELETE mutation
            // because we know the view is concrete, and still in the new
            // hierarchy.
            mutationContainer.removeMutations.push_back(
                ShadowViewMutation::RemoveMutation(
                    parentShadowView,
                    otherTreeView,
                    static_cast<int>(oldChildPair.mountIndex)));
            continue;
          }

          mutationContainer.removeMutations.push_back(
              ShadowViewMutation::RemoveMutation(
                  parentShadowView,
                  oldChildPair.shadowView,
                  static_cast<int>(oldChildPair.mountIndex)));

          deletionCandidatePairs.insert(
              {oldChildPair.shadowView.tag, &oldChildPair});

          continue;
        }
      }

      // At this point, oldTag is -1 or is in the new list, and hasn't been
      // inserted or matched yet. We're not sure yet if the new node is in the
      // old list - generate an insert instruction for the new node.
      auto &newChildPair = *newChildPairs[newIndex];
      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 10: Inserting tag/tree that was not (yet?) removed from hierarchy: "
            << newIndex << "/" << newSize << ": ["
            << newChildPair.shadowView.tag << "]"
            << (newChildPair.flattened ? " (flattened)" : "")
            << (newChildPair.isConcreteView ? " (concrete)" : "")
            << " with parent: [" << parentShadowView.tag << "]";
      });
      if (newChildPair.isConcreteView) {
        mutationContainer.insertMutations.push_back(
            ShadowViewMutation::InsertMutation(
                parentShadowView,
                newChildPair.shadowView,
                static_cast<int>(newChildPair.mountIndex)));
      }

      // `inOtherTree` is only set to true during flattening/unflattening of
      // parent. If the parent isn't (un)flattened, this will always be
      // `false`, even if the node is in the other (old) tree. In this case,
      // we expect the node to be removed from `newInsertedPairs` when we
      // later encounter it in this loop.
      if (!newChildPair.inOtherTree()) {
        newInsertedPairs.insert({newChildPair.shadowView.tag, &newChildPair});
      }

      newIndex++;
    }

    // Penultimate step: generate Delete instructions for entirely deleted
    // subtrees/nodes. We do this here because we need to traverse the entire
    // list to make sure that a node was not reparented into an unflattened
    // node that occurs *after* it in the hierarchy, due to zIndex ordering.
    for (auto &deletionCandidatePair : deletionCandidatePairs) {
      if (deletionCandidatePair.first == 0) {
        continue;
      }

      auto const &oldChildPair = *deletionCandidatePair.second;

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 11: Deleting tag/tree that was not in new hierarchy: "
            << "[" << oldChildPair.shadowView.tag << "]"
            << (oldChildPair.flattened ? "(flattened)" : "")
            << (oldChildPair.isConcreteView ? "(concrete)" : "")
            << (oldChildPair.inOtherTree() ? "(in other tree)" : "")
            << " with parent: [" << parentShadowView.tag << "] ##"
            << std::hash<ShadowView>{}(oldChildPair.shadowView);
      });

      // This can happen when the parent is unflattened
      if (!oldChildPair.inOtherTree() && oldChildPair.isConcreteView) {
        mutationContainer.deleteMutations.push_back(
            ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));

        // We also have to call the algorithm recursively to clean up the
        // entire subtree starting from the removed view.
        ViewNodePairScope innerScope{};
        calculateShadowViewMutationsV2(
            innerScope,
            mutationContainer.destructiveDownwardMutations,
            oldChildPair.shadowView,
            sliceChildShadowNodeViewPairsFromViewNodePair(
                oldChildPair, innerScope),
            {});
      }
    }

    // Final step: generate Create instructions for entirely new
    // subtrees/nodes that are not the result of flattening or unflattening.
    for (auto &newInsertedPair : newInsertedPairs) {
      // Erased elements of a TinyMap will have a Tag/key of 0 - skip those
      // These *should* be removed by the map; there are currently no KNOWN
      // cases where TinyMap will do the wrong thing, but there are not yet
      // any unit tests explicitly for TinyMap, so this is safer for now.
      if (newInsertedPair.first == 0) {
        continue;
      }

      auto const &newChildPair = *newInsertedPair.second;

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 12: Inserting tag/tree that was not in old hierarchy: "
            << "[" << newChildPair.shadowView.tag << "]"
            << (newChildPair.flattened ? "(flattened)" : "")
            << (newChildPair.isConcreteView ? "(concrete)" : "")
            << (newChildPair.inOtherTree() ? "(in other tree)" : "")
            << " with parent: [" << parentShadowView.tag << "]";
      });

      if (!newChildPair.isConcreteView) {
        continue;
      }
      if (newChildPair.inOtherTree()) {
        continue;
      }

      mutationContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      ViewNodePairScope innerScope{};
      calculateShadowViewMutationsV2(
          innerScope,
          mutationContainer.downwardMutations,
          newChildPair.shadowView,
          {},
          sliceChildShadowNodeViewPairsFromViewNodePair(
              newChildPair, innerScope));
    }
  }

  // All mutations in an optimal order:
  std::move(
      mutationContainer.destructiveDownwardMutations.begin(),
      mutationContainer.destructiveDownwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.updateMutations.begin(),
      mutationContainer.updateMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.removeMutations.rbegin(),
      mutationContainer.removeMutations.rend(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.deleteMutations.begin(),
      mutationContainer.deleteMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.createMutations.begin(),
      mutationContainer.createMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.downwardMutations.begin(),
      mutationContainer.downwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      mutationContainer.insertMutations.begin(),
      mutationContainer.insertMutations.end(),
      std::back_inserter(mutations));
}

/**
 * Only used by unit tests currently.
 */
static void sliceChildShadowNodeViewPairsRecursivelyLegacy(
    ShadowViewNodePair::OwningList &pairList,
    Point layoutOffset,
    ShadowNode const &shadowNode) {
  for (auto const &sharedChildShadowNode : shadowNode.getChildren()) {
    auto &childShadowNode = *sharedChildShadowNode;

#ifndef ANDROID
    // Temporary disabled on Android because the mounting infrastructure
    // is not fully ready yet.
    if (childShadowNode.getTraits().check(ShadowNodeTraits::Trait::Hidden)) {
      continue;
    }
#endif

    auto shadowView = ShadowView(childShadowNode);
    auto origin = layoutOffset;
    if (shadowView.layoutMetrics != EmptyLayoutMetrics) {
      origin += shadowView.layoutMetrics.frame.origin;
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

      sliceChildShadowNodeViewPairsRecursivelyLegacy(
          pairList, origin, childShadowNode);
    }
  }
}

/**
 * Only used by unit tests currently.
 */
ShadowViewNodePair::OwningList sliceChildShadowNodeViewPairsLegacy(
    ShadowNode const &shadowNode) {
  auto pairList = ShadowViewNodePair::OwningList{};

  if (!shadowNode.getTraits().check(
          ShadowNodeTraits::Trait::FormsStackingContext) &&
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView)) {
    return pairList;
  }

  sliceChildShadowNodeViewPairsRecursivelyLegacy(pairList, {0, 0}, shadowNode);

  return pairList;
}

ShadowViewMutation::List calculateShadowViewMutations(
    ShadowNode const &oldRootShadowNode,
    ShadowNode const &newRootShadowNode) {
  SystraceSection s("calculateShadowViewMutations");

  // Root shadow nodes must be belong the same family.
  react_native_assert(
      ShadowNode::sameFamily(oldRootShadowNode, newRootShadowNode));

  // See explanation of scope in Differentiator.h.
  ViewNodePairScope viewNodePairScope{};
  ViewNodePairScope innerViewNodePairScope{};

  auto mutations = ShadowViewMutation::List{};
  mutations.reserve(256);

  auto oldRootShadowView = ShadowView(oldRootShadowNode);
  auto newRootShadowView = ShadowView(newRootShadowNode);

  if (oldRootShadowView != newRootShadowView) {
    mutations.push_back(ShadowViewMutation::UpdateMutation(
        oldRootShadowView, newRootShadowView, {}));
  }

  calculateShadowViewMutationsV2(
      innerViewNodePairScope,
      mutations,
      ShadowView(oldRootShadowNode),
      sliceChildShadowNodeViewPairsV2(oldRootShadowNode, viewNodePairScope),
      sliceChildShadowNodeViewPairsV2(newRootShadowNode, viewNodePairScope));

  return mutations;
}

} // namespace facebook::react
