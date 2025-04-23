/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "sliceChildShadowNodeViewPairs.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/LayoutableShadowNode.h>

#include "ShadowViewNodePair.h"

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
  if (pairs.size() < 2) {
    return;
  }

  auto isReorderNeeded = false;
  for (const auto& pair : pairs) {
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

static void sliceChildShadowNodeViewPairsRecursively(
    std::vector<ShadowViewNodePair*>& pairList,
    size_t& startOfStaticIndex,
    ViewNodePairScope& scope,
    Point layoutOffset,
    const ShadowNode& shadowNode,
    const CullingContext& cullingContext) {
  for (const auto& sharedChildShadowNode : shadowNode.getChildren()) {
    auto& childShadowNode = *sharedChildShadowNode;
#ifndef ANDROID
    // T153547836: Disabled on Android because the mounting infrastructure
    // is not fully ready yet.
    if (childShadowNode.getTraits().check(ShadowNodeTraits::Trait::Hidden)) {
      continue;
    }
#endif
    auto shadowView = ShadowView(childShadowNode);

    if (ReactNativeFeatureFlags::enableViewCulling()) {
      if (cullingContext.shouldConsiderCulling() &&
          shadowView.layoutMetrics != EmptyLayoutMetrics) {
        auto overflowInsetFrame =
            shadowView.layoutMetrics.getOverflowInsetFrame() *
            cullingContext.transform;
        if (auto layoutableShadowNode =
                dynamic_cast<const LayoutableShadowNode*>(&childShadowNode)) {
          overflowInsetFrame =
              overflowInsetFrame * layoutableShadowNode->getTransform();
        }
        auto doesIntersect =
            Rect::intersect(cullingContext.frame, overflowInsetFrame) != Rect{};
        if (!doesIntersect) {
          continue; // Culling.
        }
      }
    }

    auto origin = layoutOffset;
    auto cullingContextCopy = cullingContext.adjustCullingContextIfNeeded(
        {.shadowView = shadowView, .shadowNode = &childShadowNode});

    if (shadowView.layoutMetrics != EmptyLayoutMetrics) {
      origin += shadowView.layoutMetrics.frame.origin;
      shadowView.layoutMetrics.frame.origin += layoutOffset;
    }

    // This might not be a FormsView, or a FormsStackingContext. We let the
    // differ handle removal of flattened views from the Mounting layer and
    // shuffling their children around.
    bool childrenFormStackingContexts = shadowNode.getTraits().check(
        ShadowNodeTraits::Trait::ChildrenFormStackingContext);
    bool isConcreteView = (childShadowNode.getTraits().check(
                               ShadowNodeTraits::Trait::FormsView) ||
                           childrenFormStackingContexts) &&
        !childShadowNode.getTraits().check(
            ShadowNodeTraits::Trait::ForceFlattenView);
    bool areChildrenFlattened =
        (!childShadowNode.getTraits().check(
             ShadowNodeTraits::Trait::FormsStackingContext) &&
         !childrenFormStackingContexts) ||
        childShadowNode.getTraits().check(
            ShadowNodeTraits::Trait::ForceFlattenView);

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

    if (shadowView.layoutMetrics.positionType == PositionType::Static) {
      auto it = pairList.begin();
      std::advance(it, startOfStaticIndex);
      pairList.insert(it, &scope.back());
      startOfStaticIndex++;
      if (areChildrenFlattened) {
        sliceChildShadowNodeViewPairsRecursively(
            pairList,
            startOfStaticIndex,
            scope,
            origin,
            childShadowNode,
            cullingContextCopy);
      }
    } else {
      pairList.push_back(&scope.back());
      if (areChildrenFlattened) {
        size_t pairListSize = pairList.size();
        sliceChildShadowNodeViewPairsRecursively(
            pairList,
            pairListSize,
            scope,
            origin,
            childShadowNode,
            cullingContextCopy);
      }
    }
  }
}

std::vector<ShadowViewNodePair*> sliceChildShadowNodeViewPairs(
    const ShadowViewNodePair& shadowNodePair,
    ViewNodePairScope& scope,
    bool allowFlattened,
    Point layoutOffset,
    const CullingContext& cullingContext) {
  const auto& shadowNode = *shadowNodePair.shadowNode;
  auto pairList = std::vector<ShadowViewNodePair*>{};

  if (shadowNodePair.flattened && shadowNodePair.isConcreteView &&
      !allowFlattened) {
    return pairList;
  }

  size_t startOfStaticIndex = 0;

  sliceChildShadowNodeViewPairsRecursively(
      pairList,
      startOfStaticIndex,
      scope,
      layoutOffset,
      shadowNode,
      cullingContext);

  // Sorting pairs based on `orderIndex` if needed.
  reorderInPlaceIfNeeded(pairList);

  // Set list and mountIndex for each after reordering
  size_t mountIndex = 0;
  for (auto child : pairList) {
    child->mountIndex =
        (child->isConcreteView ? mountIndex++ : static_cast<unsigned long>(-1));
  }

  return pairList;
}

} // namespace facebook::react
