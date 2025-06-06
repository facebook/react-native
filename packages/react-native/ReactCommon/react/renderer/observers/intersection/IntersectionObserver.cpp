/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "IntersectionObserver.h"
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <utility>

namespace facebook::react {

IntersectionObserver::IntersectionObserver(
    IntersectionObserverObserverId intersectionObserverId,
    std::optional<ShadowNodeFamily::Shared> observationRootShadowNodeFamily,
    ShadowNodeFamily::Shared targetShadowNodeFamily,
    std::vector<Float> thresholds,
    std::optional<std::vector<Float>> rootThresholds)
    : intersectionObserverId_(intersectionObserverId),
      observationRootShadowNodeFamily_(
          std::move(observationRootShadowNodeFamily)),
      targetShadowNodeFamily_(std::move(targetShadowNodeFamily)),
      thresholds_(std::move(thresholds)),
      rootThresholds_(std::move(rootThresholds)) {}

static std::shared_ptr<const ShadowNode> getShadowNode(
    const ShadowNodeFamily::AncestorList& ancestors) {
  if (ancestors.empty()) {
    return nullptr;
  }

  const auto& lastAncestor = ancestors.back();
  const ShadowNode& parentNode = lastAncestor.first.get();
  int childIndex = lastAncestor.second;

  const std::shared_ptr<const ShadowNode>& childNode =
      parentNode.getChildren().at(childIndex);
  return childNode;
}

static Rect getRootNodeBoundingRect(const RootShadowNode& rootShadowNode) {
  const auto layoutableRootShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(&rootShadowNode);

  react_native_assert(
      layoutableRootShadowNode != nullptr &&
      "RootShadowNode instances must always inherit from LayoutableShadowNode.");

  auto layoutMetrics = layoutableRootShadowNode->getLayoutMetrics();

  if (layoutMetrics == EmptyLayoutMetrics ||
      layoutMetrics.displayType == DisplayType::None) {
    return Rect{};
  }

  // Apply the transform to translate the root view to its location in the
  // viewport.
  return layoutMetrics.frame * layoutableRootShadowNode->getTransform();
}

static Rect getBoundingRect(const ShadowNodeFamily::AncestorList& ancestors) {
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      ancestors,
      {/* .includeTransform = */ true,
       /* .includeViewportOffset = */ true});
  return layoutMetrics == EmptyLayoutMetrics ? Rect{} : layoutMetrics.frame;
}

static Rect getClippedTargetBoundingRect(
    const ShadowNodeFamily::AncestorList& targetAncestors) {
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      targetAncestors,
      {/* .includeTransform = */ true,
       /* .includeViewportOffset = */ true,
       /* .applyParentClipping = */ true});

  return layoutMetrics == EmptyLayoutMetrics ? Rect{} : layoutMetrics.frame;
}

// Partially equivalent to
// https://w3c.github.io/IntersectionObserver/#compute-the-intersection
static Rect computeIntersection(
    const Rect& rootBoundingRect,
    const Rect& targetBoundingRect,
    const ShadowNodeFamily::AncestorList& targetToRootAncestors,
    bool hasCustomRoot) {
  auto absoluteIntersectionRect =
      Rect::intersect(rootBoundingRect, targetBoundingRect);

  Float absoluteIntersectionRectArea = absoluteIntersectionRect.size.width *
      absoluteIntersectionRect.size.height;

  Float targetBoundingRectArea =
      targetBoundingRect.size.width * targetBoundingRect.size.height;

  // Finish early if there is not intersection between the root and the target
  // before we do any clipping.
  if (absoluteIntersectionRectArea == 0 || targetBoundingRectArea == 0) {
    return {};
  }

  // Coordinates of the target after clipping the parts hidden by a parent,
  // until till the root (e.g.: in scroll views, or in views with a parent with
  // overflow: hidden)
  auto clippedTargetFromRoot =
      getClippedTargetBoundingRect(targetToRootAncestors);

  auto clippedTargetBoundingRect = hasCustomRoot ? Rect{
      rootBoundingRect.origin + clippedTargetFromRoot.origin,
      clippedTargetFromRoot.size}
      : clippedTargetFromRoot;

  return Rect::intersect(rootBoundingRect, clippedTargetBoundingRect);
}

static Float getHighestThresholdCrossed(
    Float intersectionRatio,
    const std::vector<Float>& thresholds) {
  Float highestThreshold = -1.0f;
  for (auto threshold : thresholds) {
    if (intersectionRatio >= threshold) {
      highestThreshold = threshold;
    }
  }
  return highestThreshold;
}

// Partially equivalent to
// https://w3c.github.io/IntersectionObserver/#update-intersection-observations-algo
std::optional<IntersectionObserverEntry>
IntersectionObserver::updateIntersectionObservation(
    const RootShadowNode& rootShadowNode,
    HighResTimeStamp time) {
  bool hasCustomRoot = observationRootShadowNodeFamily_.has_value();

  auto rootAncestors = hasCustomRoot
      ? observationRootShadowNodeFamily_.value()->getAncestors(rootShadowNode)
      : ShadowNodeFamily::AncestorList{};

  // Absolute coordinates of the root
  auto rootBoundingRect = hasCustomRoot
      ? getBoundingRect(rootAncestors)
      : getRootNodeBoundingRect(rootShadowNode);

  auto targetAncestors = targetShadowNodeFamily_->getAncestors(rootShadowNode);

  // Absolute coordinates of the target
  auto targetBoundingRect = getBoundingRect(targetAncestors);

  if ((hasCustomRoot && rootAncestors.empty()) || targetAncestors.empty()) {
    // If observation root or target is not a descendant of `rootShadowNode`
    return setNotIntersectingState(
        rootBoundingRect, targetBoundingRect, {}, time);
  }

  auto targetToRootAncestors = hasCustomRoot
      ? targetShadowNodeFamily_->getAncestors(*getShadowNode(rootAncestors))
      : targetAncestors;

  auto intersectionRect = computeIntersection(
      rootBoundingRect,
      targetBoundingRect,
      targetToRootAncestors,
      hasCustomRoot);

  Float targetBoundingRectArea =
      targetBoundingRect.size.width * targetBoundingRect.size.height;
  auto intersectionRectArea =
      intersectionRect.size.width * intersectionRect.size.height;

  Float intersectionRatio =
      targetBoundingRectArea == 0 // prevent division by zero
      ? 0
      : intersectionRectArea / targetBoundingRectArea;

  if (intersectionRatio == 0) {
    return setNotIntersectingState(
        rootBoundingRect, targetBoundingRect, intersectionRect, time);
  }

  auto highestThresholdCrossed =
      getHighestThresholdCrossed(intersectionRatio, thresholds_);

  auto highestRootThresholdCrossed = -1.0f;
  if (rootThresholds_.has_value()) {
    Float rootBoundingRectArea =
        rootBoundingRect.size.width * rootBoundingRect.size.height;
    Float rootThresholdIntersectionRatio = rootBoundingRectArea == 0
        ? 0
        : intersectionRectArea / rootBoundingRectArea;
    highestRootThresholdCrossed = getHighestThresholdCrossed(
        rootThresholdIntersectionRatio, rootThresholds_.value());
  }

  if (highestThresholdCrossed == -1.0f &&
      highestRootThresholdCrossed == -1.0f) {
    return setNotIntersectingState(
        rootBoundingRect, targetBoundingRect, intersectionRect, time);
  }

  return setIntersectingState(
      rootBoundingRect,
      targetBoundingRect,
      intersectionRect,
      highestThresholdCrossed,
      highestRootThresholdCrossed,
      time);
}

std::optional<IntersectionObserverEntry>
IntersectionObserver::updateIntersectionObservationForSurfaceUnmount(
    HighResTimeStamp time) {
  return setNotIntersectingState(Rect{}, Rect{}, Rect{}, time);
}

std::optional<IntersectionObserverEntry>
IntersectionObserver::setIntersectingState(
    const Rect& rootBoundingRect,
    const Rect& targetBoundingRect,
    const Rect& intersectionRect,
    Float threshold,
    Float rootThreshold,
    HighResTimeStamp time) {
  auto newState =
      IntersectionObserverState::Intersecting(threshold, rootThreshold);

  if (state_ != newState) {
    state_ = newState;
    IntersectionObserverEntry entry{
        intersectionObserverId_,
        targetShadowNodeFamily_,
        targetBoundingRect,
        rootBoundingRect,
        intersectionRect,
        true,
        time,
    };
    return std::optional<IntersectionObserverEntry>{std::move(entry)};
  }

  return std::nullopt;
}

std::optional<IntersectionObserverEntry>
IntersectionObserver::setNotIntersectingState(
    const Rect& rootBoundingRect,
    const Rect& targetBoundingRect,
    const Rect& intersectionRect,
    HighResTimeStamp time) {
  if (state_ != IntersectionObserverState::NotIntersecting()) {
    state_ = IntersectionObserverState::NotIntersecting();
    IntersectionObserverEntry entry{
        intersectionObserverId_,
        targetShadowNodeFamily_,
        targetBoundingRect,
        rootBoundingRect,
        intersectionRect,
        false,
        time,
    };
    return std::optional<IntersectionObserverEntry>(std::move(entry));
  }

  return std::nullopt;
}

} // namespace facebook::react
