/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/debug/flags.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <deque>

namespace facebook::react {

/*
 * Describes pair of a `ShadowView` and a `ShadowNode`.
 * This is not exposed to the mounting layer.
 */
struct ShadowViewNodePair final {
  ShadowView shadowView;
  const ShadowNode* shadowNode;

  /**
   * The ShadowNode does not form a stacking context, and the native views
   * corresponding to its children may be parented to an ancestor.
   */
  bool flattened{false};

  /**
   * Whether this ShadowNode should create a corresponding native view.
   */
  bool isConcreteView{true};
  Point contextOrigin{0, 0};

  size_t mountIndex{0};

  /**
   * This is nullptr unless `inOtherTree` is set to true.
   * We rely on this only for marginal cases. TODO: could we
   * rely on this more heavily to simplify the diffing algorithm
   * overall?
   */
  mutable const ShadowViewNodePair* otherTreePair{nullptr};

  /*
   * The stored pointer to `ShadowNode` represents an identity of the pair.
   */
  bool operator==(const ShadowViewNodePair& rhs) const;
  bool operator!=(const ShadowViewNodePair& rhs) const;

  bool inOtherTree() const {
    return this->otherTreePair != nullptr;
  }
};

/**
 * During differ, we need to keep some `ShadowViewNodePair`s in memory.
 * Some `ShadowViewNodePair`s are referenced from std::vectors returned
 * by `sliceChildShadowNodeViewPairsV2`; some are referenced in TinyMaps
 * for view (un)flattening especially; and it is not always clear which
 * std::vectors will outlive which TinyMaps, and vice-versa, so it doesn't
 * make sense for the std::vector or TinyMap to own any `ShadowViewNodePair`s.
 *
 * Thus, we introduce the concept of a scope.
 *
 * For the duration of some operation, we keep a ViewNodePairScope around, such
 * that: (1) the ViewNodePairScope keeps each
 * ShadowViewNodePair alive, (2) we have a stable pointer value that we can
 * use to reference each ShadowViewNodePair (not guaranteed with std::vector,
 * for example, which may have to resize and move values around).
 *
 * As long as we only manipulate the data-structure with push_back, std::deque
 * both (1) ensures that pointers into the data-structure are never invalidated,
 * and (2) tries to efficiently allocate storage such that as many objects as
 * possible are close in memory, but does not guarantee adjacency.
 */
using ViewNodePairScope = std::deque<ShadowViewNodePair>;

/*
 * Calculates a list of view mutations which describes how the old
 * `ShadowTree` can be transformed to the new one.
 * The list of mutations might be and might not be optimal.
 */
ShadowViewMutation::List calculateShadowViewMutations(
    const ShadowNode& oldRootShadowNode,
    const ShadowNode& newRootShadowNode);

/**
 * Generates a list of `ShadowViewNodePair`s that represents a layer of a
 * flattened view hierarchy. The V2 version preserves nodes even if they do
 * not form views and their children are flattened.
 */
std::vector<ShadowViewNodePair*> sliceChildShadowNodeViewPairs(
    const ShadowViewNodePair& shadowNodePair,
    ViewNodePairScope& viewNodePairScope,
    bool allowFlattened = false,
    Point layoutOffset = {0, 0});

} // namespace facebook::react
