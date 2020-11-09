/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Differentiator.h"

#include <better/map.h>
#include <better/small_vector.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/debug/SystraceSection.h>
#include <algorithm>
#include "ShadowView.h"

// Uncomment this to enable verbose diffing logs, which can be useful for
// debugging.
// #define DEBUG_LOGS_DIFFER

#ifdef DEBUG_LOGS_DIFFER
#include <glog/logging.h>
#define DEBUG_LOGS(code) code
#else
#define DEBUG_LOGS(code)
#endif

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

    assert(key != 0);

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
    assert(pair.first != 0);
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

static void sliceChildShadowNodeViewPairsRecursivelyV2(
    ShadowViewNodePair::List &pairList,
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
    bool isConcreteView =
        childShadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView);
    bool areChildrenFlattened = !childShadowNode.getTraits().check(
        ShadowNodeTraits::Trait::FormsStackingContext);
    pairList.push_back(
        {shadowView, &childShadowNode, areChildrenFlattened, isConcreteView});

    if (!childShadowNode.getTraits().check(
            ShadowNodeTraits::Trait::FormsStackingContext)) {
      sliceChildShadowNodeViewPairsRecursivelyV2(
          pairList, origin, childShadowNode);
    }
  }
}

ShadowViewNodePair::List sliceChildShadowNodeViewPairsV2(
    ShadowNode const &shadowNode,
    bool allowFlattened) {
  auto pairList = ShadowViewNodePair::List{};

  if (!shadowNode.getTraits().check(
          ShadowNodeTraits::Trait::FormsStackingContext) &&
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView) &&
      !allowFlattened) {
    return pairList;
  }

  sliceChildShadowNodeViewPairsRecursivelyV2(pairList, {0, 0}, shadowNode);

  // Sorting pairs based on `orderIndex` if needed.
  reorderInPlaceIfNeeded(pairList);

  // Set list and mountIndex for each after reordering
  size_t mountIndex = 0;
  for (auto &child : pairList) {
    child.mountIndex = (child.isConcreteView ? mountIndex++ : -1);
  }

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

// Forward declaration
static void calculateShadowViewMutationsV2(
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::List &&oldChildPairs,
    ShadowViewNodePair::List &&newChildPairs);

struct OrderedMutationInstructionContainer {
  ShadowViewMutation::List &createMutations;
  ShadowViewMutation::List &deleteMutations;
  ShadowViewMutation::List &insertMutations;
  ShadowViewMutation::List &removeMutations;
  ShadowViewMutation::List &updateMutations;
  ShadowViewMutation::List &downwardMutations;
  ShadowViewMutation::List &destructiveDownwardMutations;
};

static void calculateShadowViewMutationsFlattener(
    ReparentMode reparentMode,
    OrderedMutationInstructionContainer &mutationInstructionContainer,
    ShadowView const &parentShadowView,
    TinyMap<Tag, ShadowViewNodePair *> &unvisitedFlattenedNodes,
    ShadowViewNodePair const &node,
    TinyMap<Tag, ShadowViewNodePair *> *parentSubVisitedOtherNewNodes = nullptr,
    TinyMap<Tag, ShadowViewNodePair *> *parentSubVisitedOtherOldNodes =
        nullptr);

/**
 * Here we flatten or unflatten a subtree, given an unflattened node in either
 * the old or new tree, and a list of flattened nodes in the other tree.
 *
 * For example: if you are Flattening, the node will be in the old tree and the
 * list will be from the new tree. If you are Unflattening, the opposite is
 true.

 * It is currently not possible for ReactJS, and therefore React Native, to move
 * a node *from* one parent to another without an entirely new subtree being
 * created. When we "reparent" in React Native here it is only because
 intermediate
 * ShadowNodes/ShadowViews, which *always* exist, are flattened or unflattened
 away.
 * Thus, this algorithm handles the very specialized cases of the tree
 collapsing or
 * expanding vertically in that way.

 * Sketch of algorithm:
 * 0. Create a map of nodes in the flattened list. This should be done *before*
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
 *    performed in the subtree. If it *is* in the map, it means the node is not
 *    * in the Tree, and should be Deleted/Created
 *    **after this function is called**, by the caller.
 */
static void calculateShadowViewMutationsFlattener(
    ReparentMode reparentMode,
    OrderedMutationInstructionContainer &mutationInstructionContainer,
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
  ShadowViewNodePair::List treeChildren =
      sliceChildShadowNodeViewPairsV2(*node.shadowNode);

  DEBUG_LOGS({
    LOG(ERROR) << "Differ Flattener 1.4: "
               << (reparentMode == ReparentMode::Unflatten ? "Unflattening"
                                                           : "Flattening")
               << " [" << node.shadowView.tag << "]";
    LOG(ERROR) << "Differ Flattener Entry: Child Pairs: ";
    std::string strTreeChildPairs;
    for (size_t k = 0; k < treeChildren.size(); k++) {
      strTreeChildPairs.append(std::to_string(treeChildren[k].shadowView.tag));
      strTreeChildPairs.append(treeChildren[k].isConcreteView ? "" : "'");
      strTreeChildPairs.append(treeChildren[k].flattened ? "*" : "");
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

  // Views in other tree that are visited by sub-flattening or sub-unflattening
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
    // First, remove all children of the tree being flattened, or insert
    // children into parent tree if they're being unflattened. Then, look up
    // each node in the "unvisited" list and update the nodes and subtrees if
    // appropriate.
    auto &treeChildPair = treeChildren[index];

    //  Caller will take care of the corresponding action in the other tree.
    if (treeChildPair.isConcreteView) {
      if (reparentMode == ReparentMode::Flatten) {
        mutationInstructionContainer.removeMutations.push_back(
            ShadowViewMutation::RemoveMutation(
                node.shadowView,
                treeChildPair.shadowView,
                treeChildPair.mountIndex));
      } else {
        mutationInstructionContainer.insertMutations.push_back(
            ShadowViewMutation::InsertMutation(
                node.shadowView,
                treeChildPair.shadowView,
                treeChildPair.mountIndex));
      }
    }

    // Try to find node in other tree
    auto unvisitedIt = unvisitedOtherNodes.find(treeChildPair.shadowView.tag);
    auto subVisitedOtherNewIt =
        (unvisitedIt == unvisitedOtherNodes.end()
             ? subVisitedNewMap->find(treeChildPair.shadowView.tag)
             : subVisitedNewMap->end());
    auto subVisitedOtherOldIt =
        (unvisitedIt == unvisitedOtherNodes.end()
             ? subVisitedOldMap->find(treeChildPair.shadowView.tag)
             : subVisitedOldMap->end());

    // Find in other tree
    if (unvisitedIt != unvisitedOtherNodes.end() ||
        subVisitedOtherNewIt != subVisitedNewMap->end() ||
        subVisitedOtherOldIt != subVisitedOldMap->end()) {
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

      auto &otherTreeNodePair =
          *(unvisitedIt != unvisitedOtherNodes.end()
                ? unvisitedIt->second
                : (subVisitedOtherNewIt != subVisitedNewMap->end()
                       ? subVisitedOtherNewIt->second
                       : subVisitedOtherOldIt->second));

      // If we've already done updates, don't repeat it.
      if (treeChildPair.inOtherTree || otherTreeNodePair.inOtherTree) {
        continue;
      }

      auto &newTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? otherTreeNodePair
                                                 : treeChildPair);
      auto &oldTreeNodePair =
          (reparentMode == ReparentMode::Flatten ? treeChildPair
                                                 : otherTreeNodePair);

      if (newTreeNodePair.shadowView != oldTreeNodePair.shadowView &&
          newTreeNodePair.isConcreteView && oldTreeNodePair.isConcreteView) {
        mutationInstructionContainer.updateMutations.push_back(
            ShadowViewMutation::UpdateMutation(
                parentShadowView,
                oldTreeNodePair.shadowView,
                newTreeNodePair.shadowView,
                newTreeNodePair.mountIndex));
      }

      // Update children if appropriate.
      if (!oldTreeNodePair.flattened && !newTreeNodePair.flattened) {
        if (oldTreeNodePair.shadowNode != newTreeNodePair.shadowNode) {
          calculateShadowViewMutationsV2(
              mutationInstructionContainer.downwardMutations,
              newTreeNodePair.shadowView,
              sliceChildShadowNodeViewPairsV2(*oldTreeNodePair.shadowNode),
              sliceChildShadowNodeViewPairsV2(*newTreeNodePair.shadowNode));
        }
      } else if (oldTreeNodePair.flattened != newTreeNodePair.flattened) {
        // We need to handle one of the children being flattened or unflattened,
        // in the context of a parent flattening or unflattening.
        ReparentMode childReparentMode =
            (oldTreeNodePair.flattened ? ReparentMode::Unflatten
                                       : ReparentMode::Flatten);

        // Case 1: child mode is the same as parent.
        // This is a flatten-flatten, or unflatten-unflatten.
        if (childReparentMode == reparentMode) {
          calculateShadowViewMutationsFlattener(
              childReparentMode,
              mutationInstructionContainer,
              (reparentMode == ReparentMode::Flatten
                   ? parentShadowView
                   : newTreeNodePair.shadowView),
              unvisitedOtherNodes,
              treeChildPair,
              subVisitedNewMap,
              subVisitedOldMap);
        } else {
          // Unflatten parent, flatten child
          if (childReparentMode == ReparentMode::Flatten) {
            // Construct unvisited nodes map
            auto unvisitedNewChildPairs = TinyMap<Tag, ShadowViewNodePair *>{};
            // Memory note: these oldFlattenedNodes all disappear at the end of
            // this "else" block, including any annotations we put on them.
            auto newFlattenedNodes = sliceChildShadowNodeViewPairsV2(
                *newTreeNodePair.shadowNode, true);
            for (size_t i = 0; i < newFlattenedNodes.size(); i++) {
              auto &newChild = newFlattenedNodes[i];

              auto unvisitedOtherNodesIt =
                  unvisitedOtherNodes.find(newChild.shadowView.tag);
              if (unvisitedOtherNodesIt != unvisitedOtherNodes.end()) {
                auto &unvisitedItPair = *unvisitedOtherNodesIt->second;
                unvisitedNewChildPairs.insert(
                    {unvisitedItPair.shadowView.tag, &unvisitedItPair});
              } else {
                unvisitedNewChildPairs.insert(
                    {newChild.shadowView.tag, &newChild});
              }
            }

            // Flatten old tree into new list
            // At the end of this loop we still want to know which of these
            // children are visited, so we reuse the `newRemainingPairs` map.
            calculateShadowViewMutationsFlattener(
                ReparentMode::Flatten,
                mutationInstructionContainer,
                (reparentMode == ReparentMode::Flatten
                     ? parentShadowView
                     : newTreeNodePair.shadowView),
                unvisitedNewChildPairs,
                oldTreeNodePair,
                subVisitedNewMap,
                subVisitedOldMap);

            for (auto &newFlattenedNode : newFlattenedNodes) {
              auto unvisitedOldChildPairIt =
                  unvisitedNewChildPairs.find(newFlattenedNode.shadowView.tag);

              if (unvisitedOldChildPairIt == unvisitedNewChildPairs.end()) {
                // Node was visited.

                auto deleteCreateIt = deletionCreationCandidatePairs.find(
                    newFlattenedNode.shadowView.tag);
                if (deleteCreateIt != deletionCreationCandidatePairs.end()) {
                  deletionCreationCandidatePairs.erase(deleteCreateIt);
                }
              }
            }
          }
          // Flatten parent, unflatten child
          else {
            // Construct unvisited nodes map
            auto unvisitedOldChildPairs = TinyMap<Tag, ShadowViewNodePair *>{};
            // Memory note: these oldFlattenedNodes all disappear at the end of
            // this "else" block, including any annotations we put on them.
            auto oldFlattenedNodes = sliceChildShadowNodeViewPairsV2(
                *oldTreeNodePair.shadowNode, true);
            for (size_t i = 0; i < oldFlattenedNodes.size(); i++) {
              auto &oldChild = oldFlattenedNodes[i];

              auto unvisitedOtherNodesIt =
                  unvisitedOtherNodes.find(oldChild.shadowView.tag);
              if (unvisitedOtherNodesIt != unvisitedOtherNodes.end()) {
                auto &unvisitedItPair = *unvisitedOtherNodesIt->second;
                unvisitedOldChildPairs.insert(
                    {unvisitedItPair.shadowView.tag, &unvisitedItPair});
              } else {
                unvisitedOldChildPairs.insert(
                    {oldChild.shadowView.tag, &oldChild});
              }
            }

            // Unflatten old list into new tree
            calculateShadowViewMutationsFlattener(
                ReparentMode::Unflatten,
                mutationInstructionContainer,
                (reparentMode == ReparentMode::Flatten
                     ? parentShadowView
                     : newTreeNodePair.shadowView),
                unvisitedOldChildPairs,
                newTreeNodePair,
                subVisitedNewMap,
                subVisitedOldMap);

            // If old nodes were not visited, we know that we can delete them
            // now. They will be removed from the hierarchy by the outermost
            // loop of this function.
            for (auto &oldFlattenedNode : oldFlattenedNodes) {
              auto unvisitedOldChildPairIt =
                  unvisitedOldChildPairs.find(oldFlattenedNode.shadowView.tag);
              if (unvisitedOldChildPairIt != unvisitedOldChildPairs.end()) {
                // Node unvisited - mark the entire subtree for deletion
                if (oldFlattenedNode.isConcreteView) {
                  auto tag = oldFlattenedNode.shadowView.tag;
                  auto oldRemainingChildInListIt = std::find_if(
                      treeChildren.begin(),
                      treeChildren.end(),
                      [&tag](ShadowViewNodePair &nodePair) {
                        return nodePair.shadowView.tag == tag;
                      });
                  if (oldRemainingChildInListIt != treeChildren.end()) {
                    auto deleteCreateIt = deletionCreationCandidatePairs.find(
                        oldFlattenedNode.shadowView.tag);
                    if (deleteCreateIt ==
                        deletionCreationCandidatePairs.end()) {
                      deletionCreationCandidatePairs.insert(
                          {tag, &*oldRemainingChildInListIt});
                    }
                  } else {
                    // TODO: we might want to remove this block. It seems
                    // impossible to hit this logically (and empirically, after
                    // testing on lots of randomized and pathologically
                    // constructed trees) but I'm leaving this here out of an
                    // abundance of caution.
                    mutationInstructionContainer.deleteMutations.push_back(
                        ShadowViewMutation::DeleteMutation(
                            oldFlattenedNode.shadowView));

                    calculateShadowViewMutationsV2(
                        mutationInstructionContainer
                            .destructiveDownwardMutations,
                        oldFlattenedNode.shadowView,
                        sliceChildShadowNodeViewPairsV2(
                            *oldFlattenedNode.shadowNode),
                        {});
                  }
                }
              } else {
                // Node was visited - make sure to remove it from
                // "newRemainingPairs" map
                auto newRemainingIt =
                    unvisitedOtherNodes.find(oldFlattenedNode.shadowView.tag);
                if (newRemainingIt != unvisitedOtherNodes.end()) {
                  unvisitedOtherNodes.erase(newRemainingIt);
                }

                // We also remove it from delete/creation candidates
                auto deleteCreateIt = deletionCreationCandidatePairs.find(
                    oldFlattenedNode.shadowView.tag);
                if (deleteCreateIt != deletionCreationCandidatePairs.end()) {
                  deletionCreationCandidatePairs.erase(deleteCreateIt);
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
      if (newTreeNodePair.isConcreteView != oldTreeNodePair.isConcreteView &&
          !newTreeNodePair.inOtherTree) {
        if (newTreeNodePair.isConcreteView) {
          mutationInstructionContainer.createMutations.push_back(
              ShadowViewMutation::CreateMutation(newTreeNodePair.shadowView));
        } else {
          mutationInstructionContainer.deleteMutations.push_back(
              ShadowViewMutation::DeleteMutation(newTreeNodePair.shadowView));
        }
      }

      treeChildPair.inOtherTree = true;
      otherTreeNodePair.inOtherTree = true;

      if (parentSubVisitedOtherNewNodes != nullptr) {
        parentSubVisitedOtherNewNodes->insert(
            {newTreeNodePair.shadowView.tag, &newTreeNodePair});
      }
      if (parentSubVisitedOtherOldNodes != nullptr) {
        parentSubVisitedOtherOldNodes->insert(
            {oldTreeNodePair.shadowView.tag, &oldTreeNodePair});
      }

      if (unvisitedIt != unvisitedOtherNodes.end()) {
        unvisitedOtherNodes.erase(unvisitedIt);
      }
    } else {
      // Node does not in exist in other tree.
      if (treeChildPair.isConcreteView && !treeChildPair.inOtherTree) {
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
  // subtrees if they were never visited during the execution of the above loop
  // and recursions.
  for (auto it = deletionCreationCandidatePairs.begin();
       it != deletionCreationCandidatePairs.end();
       it++) {
    if (it->first == 0) {
      continue;
    }
    auto &treeChildPair = *it->second;

    // If node was visited during a flattening/unflattening recursion.
    if (treeChildPair.inOtherTree) {
      continue;
    }

    if (reparentMode == ReparentMode::Flatten) {
      mutationInstructionContainer.deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(treeChildPair.shadowView));

      if (!treeChildPair.flattened) {
        calculateShadowViewMutationsV2(
            mutationInstructionContainer.destructiveDownwardMutations,
            treeChildPair.shadowView,
            sliceChildShadowNodeViewPairsV2(*treeChildPair.shadowNode),
            {});
      }
    } else {
      mutationInstructionContainer.createMutations.push_back(
          ShadowViewMutation::CreateMutation(treeChildPair.shadowView));

      if (!treeChildPair.flattened) {
        calculateShadowViewMutationsV2(
            mutationInstructionContainer.downwardMutations,
            treeChildPair.shadowView,
            {},
            sliceChildShadowNodeViewPairsV2(*treeChildPair.shadowNode));
      }
    }
  }
}

static void calculateShadowViewMutationsV2(
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::List &&oldChildPairs,
    ShadowViewNodePair::List &&newChildPairs) {
  if (oldChildPairs.empty() && newChildPairs.empty()) {
    return;
  }

  size_t index = 0;

  // Lists of mutations
  auto createMutations = ShadowViewMutation::List{};
  auto deleteMutations = ShadowViewMutation::List{};
  auto insertMutations = ShadowViewMutation::List{};
  auto removeMutations = ShadowViewMutation::List{};
  auto updateMutations = ShadowViewMutation::List{};
  auto downwardMutations = ShadowViewMutation::List{};
  auto destructiveDownwardMutations = ShadowViewMutation::List{};
  auto mutationInstructionContainer =
      OrderedMutationInstructionContainer{createMutations,
                                          deleteMutations,
                                          insertMutations,
                                          removeMutations,
                                          updateMutations,
                                          downwardMutations,
                                          destructiveDownwardMutations};

  DEBUG_LOGS({
    LOG(ERROR) << "Differ Entry: Child Pairs of node: [" << parentShadowView.tag
               << "]";
    std::string strOldChildPairs;
    for (size_t oldIndex = 0; oldIndex < oldChildPairs.size(); oldIndex++) {
      strOldChildPairs.append(
          std::to_string(oldChildPairs[oldIndex].shadowView.tag));
      strOldChildPairs.append(
          oldChildPairs[oldIndex].isConcreteView ? "" : "'");
      strOldChildPairs.append(oldChildPairs[oldIndex].flattened ? "*" : "");
      strOldChildPairs.append(", ");
    }
    std::string strNewChildPairs;
    for (size_t newIndex = 0; newIndex < newChildPairs.size(); newIndex++) {
      strNewChildPairs.append(
          std::to_string(newChildPairs[newIndex].shadowView.tag));
      strNewChildPairs.append(
          newChildPairs[newIndex].isConcreteView ? "" : "'");
      strNewChildPairs.append(newChildPairs[newIndex].flattened ? "*" : "");
      strNewChildPairs.append(", ");
    }
    LOG(ERROR) << "Differ Entry: Old Child Pairs: " << strOldChildPairs;
    LOG(ERROR) << "Differ Entry: New Child Pairs: " << strNewChildPairs;
  });

  // Stage 1: Collecting `Update` mutations
  for (index = 0; index < oldChildPairs.size() && index < newChildPairs.size();
       index++) {
    auto &oldChildPair = oldChildPairs[index];
    auto &newChildPair = newChildPairs[index];

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

    // If either view was flattened, and that has changed this frame, don't try
    // to update
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
      updateMutations.push_back(ShadowViewMutation::UpdateMutation(
          parentShadowView,
          oldChildPair.shadowView,
          newChildPair.shadowView,
          newChildPair.mountIndex));
    }

    // Recursively update tree if ShadowNode pointers are not equal
    if (!oldChildPair.flattened &&
        oldChildPair.shadowNode != newChildPair.shadowNode) {
      auto oldGrandChildPairs =
          sliceChildShadowNodeViewPairsV2(*oldChildPair.shadowNode);
      auto newGrandChildPairs =
          sliceChildShadowNodeViewPairsV2(*newChildPair.shadowNode);
      calculateShadowViewMutationsV2(
          *(newGrandChildPairs.size() ? &downwardMutations
                                      : &destructiveDownwardMutations),
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
      auto const &oldChildPair = oldChildPairs[index];

      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 2: Deleting Tag/Tree: ["
                   << oldChildPair.shadowView.tag << "]"
                   << " with parent: [" << parentShadowView.tag << "]";
      });

      if (!oldChildPair.isConcreteView) {
        continue;
      }

      deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));
      removeMutations.push_back(ShadowViewMutation::RemoveMutation(
          parentShadowView, oldChildPair.shadowView, oldChildPair.mountIndex));

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed view.
      calculateShadowViewMutationsV2(
          destructiveDownwardMutations,
          oldChildPair.shadowView,
          sliceChildShadowNodeViewPairsV2(*oldChildPair.shadowNode),
          {});
    }
  } else if (index == oldChildPairs.size()) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be create+insert.
    for (; index < newChildPairs.size(); index++) {
      auto const &newChildPair = newChildPairs[index];

      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 3: Creating Tag/Tree: ["
                   << newChildPair.shadowView.tag << "]"
                   << " with parent: [" << parentShadowView.tag << "]";
      });

      if (!newChildPair.isConcreteView) {
        continue;
      }

      insertMutations.push_back(ShadowViewMutation::InsertMutation(
          parentShadowView, newChildPair.shadowView, newChildPair.mountIndex));
      createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      calculateShadowViewMutationsV2(
          downwardMutations,
          newChildPair.shadowView,
          {},
          sliceChildShadowNodeViewPairsV2(*newChildPair.shadowNode));
    }
  } else {
    // Collect map of tags in the new list
    auto newRemainingPairs = TinyMap<Tag, ShadowViewNodePair *>{};
    auto newInsertedPairs = TinyMap<Tag, ShadowViewNodePair *>{};
    auto deletionCandidatePairs = TinyMap<Tag, ShadowViewNodePair const *>{};
    for (; index < newChildPairs.size(); index++) {
      auto &newChildPair = newChildPairs[index];
      newRemainingPairs.insert({newChildPair.shadowView.tag, &newChildPair});
    }

    // Walk through both lists at the same time
    // We will perform updates, create+insert, remove+delete, remove+insert
    // (move) here.
    size_t oldIndex = lastIndexAfterFirstStage,
           newIndex = lastIndexAfterFirstStage, newSize = newChildPairs.size(),
           oldSize = oldChildPairs.size();
    while (newIndex < newSize || oldIndex < oldSize) {
      bool haveNewPair = newIndex < newSize;
      bool haveOldPair = oldIndex < oldSize;

      // Advance both pointers if pointing to the same element
      if (haveNewPair && haveOldPair) {
        auto const &oldChildPair = oldChildPairs[oldIndex];
        auto const &newChildPair = newChildPairs[newIndex];

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

          // Check concrete-ness of views
          // Create/Delete and Insert/Remove if necessary
          if (oldChildPair.isConcreteView != newChildPair.isConcreteView) {
            if (newChildPair.isConcreteView) {
              insertMutations.push_back(ShadowViewMutation::InsertMutation(
                  parentShadowView,
                  newChildPair.shadowView,
                  newChildPair.mountIndex));
              createMutations.push_back(
                  ShadowViewMutation::CreateMutation(newChildPair.shadowView));
            } else {
              removeMutations.push_back(ShadowViewMutation::RemoveMutation(
                  parentShadowView,
                  oldChildPair.shadowView,
                  oldChildPair.mountIndex));
              deleteMutations.push_back(
                  ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));
            }
          } else if (
              oldChildPair.isConcreteView && newChildPair.isConcreteView) {
            // Even if node's children are flattened, it might still be a
            // concrete view. The case where they're different is handled above.
            if (oldChildPair.shadowView != newChildPair.shadowView) {
              updateMutations.push_back(ShadowViewMutation::UpdateMutation(
                  parentShadowView,
                  oldChildPair.shadowView,
                  newChildPair.shadowView,
                  newChildPair.mountIndex));
            }

            // Remove from newRemainingPairs
            auto newRemainingPairIt = newRemainingPairs.find(oldTag);
            if (newRemainingPairIt != newRemainingPairs.end()) {
              newRemainingPairs.erase(newRemainingPairIt);
            }
          }

          // Are we flattening or unflattening either one? If node was flattened
          // in both trees, there's no change, just continue.
          if (oldChildPair.flattened && newChildPair.flattened) {
            newIndex++;
            oldIndex++;
            continue;
          }
          // We are either flattening or unflattening this node.
          if (oldChildPair.flattened != newChildPair.flattened) {
            DEBUG_LOGS({
              LOG(ERROR) << "Differ: flattening or unflattening at branch 6: ["
                         << oldChildPair.shadowView.tag << "] ["
                         << newChildPair.shadowView.tag << "] "
                         << oldChildPair.flattened << " "
                         << newChildPair.flattened << " with parent: ["
                         << parentShadowView.tag << "]";
            });

            // Flattening
            if (!oldChildPair.flattened) {
              // Flatten old tree into new list
              // At the end of this loop we still want to know which of these
              // children are visited, so we reuse the `newRemainingPairs` map.
              calculateShadowViewMutationsFlattener(
                  ReparentMode::Flatten,
                  mutationInstructionContainer,
                  parentShadowView,
                  newRemainingPairs,
                  oldChildPair);
            }
            // Unflattening
            else {
              // Construct unvisited nodes map
              auto unvisitedOldChildPairs =
                  TinyMap<Tag, ShadowViewNodePair *>{};
              // We don't know where all the children of oldChildPair are within
              // oldChildPairs, but we know that they're in the same relative
              // order. The reason for this is because of flattening + zIndex:
              // the children could be listed before the parent, interwoven with
              // children from other nodes, etc.
              auto oldFlattenedNodes = sliceChildShadowNodeViewPairsV2(
                  *oldChildPair.shadowNode, true);
              for (size_t i = 0, j = 0;
                   i < oldChildPairs.size() && j < oldFlattenedNodes.size();
                   i++) {
                auto &oldChild = oldChildPairs[i];
                if (oldChild.shadowView.tag ==
                    oldFlattenedNodes[j].shadowView.tag) {
                  unvisitedOldChildPairs.insert(
                      {oldChild.shadowView.tag, &oldChild});
                  j++;
                }
              }

              // Unflatten old list into new tree
              calculateShadowViewMutationsFlattener(
                  ReparentMode::Unflatten,
                  mutationInstructionContainer,
                  parentShadowView,
                  unvisitedOldChildPairs,
                  newChildPair);

              // If old nodes were not visited, we know that we can delete them
              // now. They will be removed from the hierarchy by the outermost
              // loop of this function.
              for (auto &oldFlattenedNode : oldFlattenedNodes) {
                auto unvisitedOldChildPairIt = unvisitedOldChildPairs.find(
                    oldFlattenedNode.shadowView.tag);
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

            newIndex++;
            oldIndex++;
            continue;
          }

          // Update subtrees if View is not flattened, and if node addresses are
          // not equal
          if (oldChildPair.shadowNode != newChildPair.shadowNode) {
            auto oldGrandChildPairs =
                sliceChildShadowNodeViewPairsV2(*oldChildPair.shadowNode);
            auto newGrandChildPairs =
                sliceChildShadowNodeViewPairsV2(*newChildPair.shadowNode);
            calculateShadowViewMutationsV2(
                *(newGrandChildPairs.size() ? &downwardMutations
                                            : &destructiveDownwardMutations),
                oldChildPair.shadowView,
                std::move(oldGrandChildPairs),
                std::move(newGrandChildPairs));
          }

          newIndex++;
          oldIndex++;
          continue;
        }
      }

      // We have an old pair, but we either don't have any remaining new pairs
      // or we have one but it's not matched up with the old pair
      if (haveOldPair) {
        auto const &oldChildPair = oldChildPairs[oldIndex];

        Tag oldTag = oldChildPair.shadowView.tag;

        // Was oldTag already inserted? This indicates a reordering, not just
        // a move. The new node has already been inserted, we just need to
        // remove the node from its old position now, and update the node's
        // subtree.
        auto const insertedIt = newInsertedPairs.find(oldTag);
        if (insertedIt != newInsertedPairs.end()) {
          auto const &newChildPair = *insertedIt->second;

          // The node has been reordered and we are also flattening or
          // unflattening
          if (oldChildPair.flattened != newChildPair.flattened) {
            DEBUG_LOGS({
              LOG(ERROR)
                  << "Differ: branch 7: Flattening or unflattening already-inserted node upon remove (move/reorder operation)."
                  << oldChildPair.shadowView.tag << " "
                  << oldChildPair.flattened << " // "
                  << newChildPair.shadowView.tag << " "
                  << newChildPair.flattened;
            });

            // Unflattening.
            // The node in question was already inserted and we are
            // *unflattening* it, so we just need to update the subtree nodes
            // and remove them from the view hierarchy. Any of the unvisited
            // nodes in the old tree will be deleted.
            // TODO: can we consolidate this code? It's identical to the first
            // block above.
            if (!oldChildPair.flattened) {
              // Flatten old tree into new list
              // At the end of this loop we still want to know which of these
              // children are visited, so we reuse the `newRemainingPairs` map.
              calculateShadowViewMutationsFlattener(
                  ReparentMode::Flatten,
                  mutationInstructionContainer,
                  parentShadowView,
                  newRemainingPairs,
                  oldChildPair);
            }
            // Unflattening
            else {
              // Construct unvisited nodes map
              auto unvisitedOldChildPairs =
                  TinyMap<Tag, ShadowViewNodePair *>{};
              // We don't know where all the children of oldChildPair are within
              // oldChildPairs, but we know that they're in the same relative
              // order. The reason for this is because of flattening + zIndex:
              // the children could be listed before the parent, interwoven with
              // children from other nodes, etc.
              auto oldFlattenedNodes = sliceChildShadowNodeViewPairsV2(
                  *oldChildPair.shadowNode, true);
              for (size_t i = 0, j = 0;
                   i < oldChildPairs.size() && j < oldFlattenedNodes.size();
                   i++) {
                auto &oldChild = oldChildPairs[i];
                if (oldChild.shadowView.tag ==
                    oldFlattenedNodes[j].shadowView.tag) {
                  unvisitedOldChildPairs.insert(
                      {oldChild.shadowView.tag, &oldChild});
                  j++;
                }
              }

              // Unflatten old list into new tree
              calculateShadowViewMutationsFlattener(
                  ReparentMode::Unflatten,
                  mutationInstructionContainer,
                  parentShadowView,
                  unvisitedOldChildPairs,
                  newChildPair);

              // If old nodes were not visited, we know that we can delete them
              // now. They will be removed from the hierarchy by the outermost
              // loop of this function. TODO: delete recursively? create
              // recursively?
              for (auto &oldFlattenedNode : oldFlattenedNodes) {
                auto unvisitedOldChildPairIt = unvisitedOldChildPairs.find(
                    oldFlattenedNode.shadowView.tag);
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
          }

          // Check concrete-ness of views
          // Create/Delete and Insert/Remove if necessary
          // TODO: document: Insert should already be handled by outermost loop,
          // but not Remove
          if (oldChildPair.isConcreteView != newChildPair.isConcreteView) {
            if (newChildPair.isConcreteView) {
              createMutations.push_back(
                  ShadowViewMutation::CreateMutation(newChildPair.shadowView));
            } else {
              removeMutations.push_back(ShadowViewMutation::RemoveMutation(
                  parentShadowView,
                  oldChildPair.shadowView,
                  oldChildPair.mountIndex));
              deleteMutations.push_back(
                  ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));
            }
          }

          // We handled this case above. We fall through to check concreteness
          // of old/new view to remove/insert create/delete above, and then bail
          // out here.
          if (oldChildPair.flattened != newChildPair.flattened) {
            newInsertedPairs.erase(insertedIt);
            oldIndex++;
            continue;
          }

          // old and new child pairs are both either flattened or unflattened at
          // this point. If they're not views, we don't need to update subtrees.
          if (oldChildPair.isConcreteView) {
            // TODO: do we always want to remove here? There are cases where we
            // might be able to remove this to prevent unnecessary
            // removes/inserts in cases of (un)flattening + reorders?
            removeMutations.push_back(ShadowViewMutation::RemoveMutation(
                parentShadowView,
                oldChildPair.shadowView,
                oldChildPair.mountIndex));

            if (oldChildPair.shadowView != newChildPair.shadowView) {
              updateMutations.push_back(ShadowViewMutation::UpdateMutation(
                  parentShadowView,
                  oldChildPair.shadowView,
                  newChildPair.shadowView,
                  newChildPair.mountIndex));
            }
          }
          if (!oldChildPair.flattened &&
              oldChildPair.shadowNode != newChildPair.shadowNode) {
            // Update subtrees
            auto oldGrandChildPairs =
                sliceChildShadowNodeViewPairsV2(*oldChildPair.shadowNode);
            auto newGrandChildPairs =
                sliceChildShadowNodeViewPairsV2(*newChildPair.shadowNode);
            calculateShadowViewMutationsV2(
                *(newGrandChildPairs.size() ? &downwardMutations
                                            : &destructiveDownwardMutations),
                oldChildPair.shadowView,
                std::move(oldGrandChildPairs),
                std::move(newGrandChildPairs));
          }

          newInsertedPairs.erase(insertedIt);
          oldIndex++;
          continue;
        }

        // Should we generate a delete+remove instruction for the old node?
        // If there's an old node and it's not found in the "new" list, we
        // generate remove+delete for this node and its subtree.
        auto const newIt = newRemainingPairs.find(oldTag);
        if (newIt == newRemainingPairs.end()) {
          DEBUG_LOGS({
            LOG(ERROR)
                << "Differ Branch 9: Removing tag that was not reinserted: "
                << oldIndex << ": [" << oldChildPair.shadowView.tag << "]"
                << (oldChildPair.flattened ? " (flattened)" : "")
                << (oldChildPair.isConcreteView ? " (concrete)" : "")
                << " with parent: [" << parentShadowView.tag << "]";
          });

          if (oldChildPair.isConcreteView) {
            removeMutations.push_back(ShadowViewMutation::RemoveMutation(
                parentShadowView,
                oldChildPair.shadowView,
                oldChildPair.mountIndex));

            deletionCandidatePairs.insert(
                {oldChildPair.shadowView.tag, &oldChildPair});
          }

          oldIndex++;
          continue;
        }
      }

      // At this point, oldTag is -1 or is in the new list, and hasn't been
      // inserted or matched yet. We're not sure yet if the new node is in the
      // old list - generate an insert instruction for the new node.
      auto &newChildPair = newChildPairs[newIndex];
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
        insertMutations.push_back(ShadowViewMutation::InsertMutation(
            parentShadowView,
            newChildPair.shadowView,
            newChildPair.mountIndex));
      }
      if (!newChildPair.inOtherTree) {
        newInsertedPairs.insert({newChildPair.shadowView.tag, &newChildPair});
      }
      newIndex++;
    }

    // Penultimate step: generate Delete instructions for entirely deleted
    // subtrees/nodes. We do this here because we need to traverse the entire
    // list to make sure that a node was not reparented into an unflattened node
    // that occurs *after* it in the hierarchy, due to zIndex ordering.
    for (auto it = deletionCandidatePairs.begin();
         it != deletionCandidatePairs.end();
         it++) {
      if (it->first == 0) {
        continue;
      }

      auto const &oldChildPair = *it->second;

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 11: Deleting tag/tree that was not in new hierarchy: "
            << "[" << oldChildPair.shadowView.tag << "]"
            << (oldChildPair.flattened ? "(flattened)" : "")
            << (oldChildPair.isConcreteView ? "(concrete)" : "")
            << (oldChildPair.inOtherTree ? "(in other tree)" : "")
            << " with parent: [" << parentShadowView.tag << "]";
      });

      // This can happen when the parent is unflattened
      if (!oldChildPair.inOtherTree) {
        deleteMutations.push_back(
            ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));

        // We also have to call the algorithm recursively to clean up the
        // entire subtree starting from the removed view.
        calculateShadowViewMutationsV2(
            destructiveDownwardMutations,
            oldChildPair.shadowView,
            sliceChildShadowNodeViewPairsV2(*oldChildPair.shadowNode),
            {});
      }
    }

    // Final step: generate Create instructions for entirely new subtrees/nodes
    // that are not the result of flattening or unflattening.
    for (auto it = newInsertedPairs.begin(); it != newInsertedPairs.end();
         it++) {
      // Erased elements of a TinyMap will have a Tag/key of 0 - skip those
      // These *should* be removed by the map; there are currently no KNOWN
      // cases where TinyMap will do the wrong thing, but there are not yet
      // any unit tests explicitly for TinyMap, so this is safer for now.
      if (it->first == 0) {
        continue;
      }

      auto const &newChildPair = *it->second;

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 12: Inserting tag/tree that was not in old hierarchy: "
            << "[" << newChildPair.shadowView.tag << "]"
            << (newChildPair.flattened ? "(flattened)" : "")
            << (newChildPair.isConcreteView ? "(concrete)" : "")
            << (newChildPair.inOtherTree ? "(in other tree)" : "")
            << " with parent: [" << parentShadowView.tag << "]";
      });

      if (!newChildPair.isConcreteView) {
        continue;
      }
      if (newChildPair.inOtherTree) {
        continue;
      }

      createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      calculateShadowViewMutationsV2(
          downwardMutations,
          newChildPair.shadowView,
          {},
          sliceChildShadowNodeViewPairsV2(*newChildPair.shadowNode));
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

static void sliceChildShadowNodeViewPairsRecursively(
    ShadowViewNodePair::List &pairList,
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

      sliceChildShadowNodeViewPairsRecursively(
          pairList, origin, childShadowNode);
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

static void calculateShadowViewMutations(
    ShadowViewMutation::List &mutations,
    ShadowView const &parentShadowView,
    ShadowViewNodePair::List &&oldChildPairs,
    ShadowViewNodePair::List &&newChildPairs) {
  if (oldChildPairs.empty() && newChildPairs.empty()) {
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
      DEBUG_LOGS({
        LOG(ERROR) << "Differ Branch 1.1: Tags Different: ["
                   << oldChildPair.shadowView.tag << "] ["
                   << newChildPair.shadowView.tag << "]";
      });

      // Totally different nodes, updating is impossible.
      break;
    }

    DEBUG_LOGS({
      LOG(ERROR) << "Differ Branch 1.2: Same tags, update and recurse: ["
                 << oldChildPair.shadowView.tag << "]"
                 << (oldChildPair.flattened ? " (flattened)" : "")
                 << (oldChildPair.isConcreteView ? " (concrete)" : "") << "["
                 << newChildPair.shadowView.tag << "]"
                 << (newChildPair.flattened ? " (flattened)" : "")
                 << (newChildPair.isConcreteView ? " (concrete)" : "");
    });

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
    calculateShadowViewMutations(
        *(newGrandChildPairs.size() ? &downwardMutations
                                    : &destructiveDownwardMutations),
        oldChildPair.shadowView,
        std::move(oldGrandChildPairs),
        std::move(newGrandChildPairs));
  }

  size_t lastIndexAfterFirstStage = index;

  if (index == newChildPairs.size()) {
    // We've reached the end of the new children. We can delete+remove the
    // rest.
    for (; index < oldChildPairs.size(); index++) {
      auto const &oldChildPair = oldChildPairs[index];

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 2: Deleting Tag/Tree (may be reparented): ["
            << oldChildPair.shadowView.tag << "]";
      });

      deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));
      removeMutations.push_back(ShadowViewMutation::RemoveMutation(
          parentShadowView, oldChildPair.shadowView, index));

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed view.
      calculateShadowViewMutations(
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

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 3: Creating Tag/Tree (may be reparented): ["
            << newChildPair.shadowView.tag << "]";
      });

      insertMutations.push_back(ShadowViewMutation::InsertMutation(
          parentShadowView, newChildPair.shadowView, index));
      createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      calculateShadowViewMutations(
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
    size_t oldIndex = lastIndexAfterFirstStage,
           newIndex = lastIndexAfterFirstStage, newSize = newChildPairs.size(),
           oldSize = oldChildPairs.size();
    while (newIndex < newSize || oldIndex < oldSize) {
      bool haveNewPair = newIndex < newSize;
      bool haveOldPair = oldIndex < oldSize;

      // Advance both pointers if pointing to the same element
      if (haveNewPair && haveOldPair) {
        auto const &newChildPair = newChildPairs[newIndex];
        auto const &oldChildPair = oldChildPairs[oldIndex];

        Tag newTag = newChildPair.shadowView.tag;
        Tag oldTag = oldChildPair.shadowView.tag;

        if (newTag == oldTag) {
          DEBUG_LOGS({
            LOG(ERROR) << "Differ Branch 5: Matched Tags at indices: "
                       << oldIndex << " " << newIndex << ": ["
                       << oldChildPair.shadowView.tag << "]["
                       << newChildPair.shadowView.tag << "]";
          });

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
          if (oldChildPair.shadowNode != newChildPair.shadowNode) {
            auto oldGrandChildPairs =
                sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
            auto newGrandChildPairs =
                sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
            calculateShadowViewMutations(
                *(newGrandChildPairs.size() ? &downwardMutations
                                            : &destructiveDownwardMutations),
                oldChildPair.shadowView,
                std::move(oldGrandChildPairs),
                std::move(newGrandChildPairs));
          }

          newIndex++;
          oldIndex++;
          continue;
        }
      }

      if (haveOldPair) {
        auto const &oldChildPair = oldChildPairs[oldIndex];
        Tag oldTag = oldChildPair.shadowView.tag;

        // Was oldTag already inserted? This indicates a reordering, not just
        // a move. The new node has already been inserted, we just need to
        // remove the node from its old position now.
        auto const insertedIt = newInsertedPairs.find(oldTag);
        if (insertedIt != newInsertedPairs.end()) {
          DEBUG_LOGS({
            LOG(ERROR)
                << "Differ Branch 6: Removing tag that was already inserted: "
                << oldIndex << ": [" << oldChildPair.shadowView.tag << "]";
          });

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
          if (oldChildPair.shadowNode != newChildPair.shadowNode) {
            auto oldGrandChildPairs =
                sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
            auto newGrandChildPairs =
                sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
            calculateShadowViewMutations(
                *(newGrandChildPairs.size() ? &downwardMutations
                                            : &destructiveDownwardMutations),
                oldChildPair.shadowView,
                std::move(oldGrandChildPairs),
                std::move(newGrandChildPairs));
          }

          newInsertedPairs.erase(insertedIt);
          oldIndex++;
          continue;
        }

        // Should we generate a delete+remove instruction for the old node?
        // If there's an old node and it's not found in the "new" list, we
        // generate remove+delete for this node and its subtree.
        auto const newIt = newRemainingPairs.find(oldTag);
        if (newIt == newRemainingPairs.end()) {
          DEBUG_LOGS({
            LOG(ERROR)
                << "Differ Branch 8: Removing tag/tree that was not reinserted (may be reparented): "
                << oldIndex << ": [" << oldChildPair.shadowView.tag << "]";
          });

          removeMutations.push_back(ShadowViewMutation::RemoveMutation(
              parentShadowView, oldChildPair.shadowView, oldIndex));

          deleteMutations.push_back(
              ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));

          // We also have to call the algorithm recursively to clean up the
          // entire subtree starting from the removed view.
          calculateShadowViewMutations(
              destructiveDownwardMutations,
              oldChildPair.shadowView,
              sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode),
              {});

          oldIndex++;
          continue;
        }
      }

      // At this point, oldTag is -1 or is in the new list, and hasn't been
      // inserted or matched yet. We're not sure yet if the new node is in the
      // old list - generate an insert instruction for the new node.
      auto const &newChildPair = newChildPairs[newIndex];
      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 9: Inserting tag/tree that was not yet removed from hierarchy (may be reparented): "
            << newIndex << ": [" << newChildPair.shadowView.tag << "]";
      });
      insertMutations.push_back(ShadowViewMutation::InsertMutation(
          parentShadowView, newChildPair.shadowView, newIndex));
      newInsertedPairs.insert({newChildPair.shadowView.tag, &newChildPair});
      newIndex++;
    }

    // Final step: generate Create instructions for new nodes
    for (auto it = newInsertedPairs.begin(); it != newInsertedPairs.end();
         it++) {
      // Erased elements of a TinyMap will have a Tag/key of 0 - skip those
      // These *should* be removed by the map; there are currently no KNOWN
      // cases where TinyMap will do the wrong thing, but there are not yet
      // any unit tests explicitly for TinyMap, so this is safer for now.
      if (it->first == 0) {
        continue;
      }

      auto const &newChildPair = *it->second;

      DEBUG_LOGS({
        LOG(ERROR)
            << "Differ Branch 9: Inserting tag/tree that was not yet removed from hierarchy (may be reparented): "
            << newIndex << ": [" << newChildPair.shadowView.tag << "]";
      });

      createMutations.push_back(
          ShadowViewMutation::CreateMutation(newChildPair.shadowView));

      calculateShadowViewMutations(
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
    ShadowNode const &oldRootShadowNode,
    ShadowNode const &newRootShadowNode,
    bool enableReparentingDetection) {
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

  if (enableReparentingDetection) {
    calculateShadowViewMutationsV2(
        mutations,
        ShadowView(oldRootShadowNode),
        sliceChildShadowNodeViewPairsV2(oldRootShadowNode),
        sliceChildShadowNodeViewPairsV2(newRootShadowNode));
  } else {
    calculateShadowViewMutations(
        mutations,
        ShadowView(oldRootShadowNode),
        sliceChildShadowNodeViewPairs(oldRootShadowNode),
        sliceChildShadowNodeViewPairs(newRootShadowNode));
  }

  return mutations;
}

} // namespace react
} // namespace facebook
