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
      {/* .includeTransform = */ .includeTransform = true,
       /* .includeViewportOffset = */ .includeViewportOffset = true});
  return layoutMetrics == EmptyLayoutMetrics ? Rect{} : layoutMetrics.frame;
}

static Rect getClippedTargetBoundingRect(
    const ShadowNodeFamily::AncestorList& targetAncestors) {
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      targetAncestors,
      {/* .includeTransform = */ .includeTransform = true,
       /* .includeViewportOffset = */ .includeViewportOffset = true,
       /* .applyParentClipping = */ .enableOverflowClipping = true});

  return layoutMetrics == EmptyLayoutMetrics ? Rect{} : layoutMetrics.frame;
}

// Distinguishes between edge-adjacent vs. no intersection
static std::optional<Rect> intersectOrNull(
    const Rect& rect1,
    const Rect& rect2) {
  auto result = Rect::intersect(rect1, rect2);
  // Check if the result has zero area (could be empty or degenerate)
  if (result.size.width == 0 || result.size.height == 0) {
    // Check if origin is within both rectangles (touching case)
    bool originInRect1 = result.origin.x >= rect1.getMinX() &&
        result.origin.x <= rect1.getMaxX() &&
        result.origin.y >= rect1.getMinY() &&
        result.origin.y <= rect1.getMaxY();

    bool originInRect2 = result.origin.x >= rect2.getMinX() &&
        result.origin.x <= rect2.getMaxX() &&
        result.origin.y >= rect2.getMinY() &&
        result.origin.y <= rect2.getMaxY();

    if (!originInRect1 || !originInRect2) {
      // No actual intersection - rectangles are separated
      return std::nullopt;
    }
  }

  // Valid intersection (including degenerate edge/corner cases)
  return result;
}

// Partially equivalent to
// https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
static std::optional<Rect> computeIntersection(
    const Rect& rootBoundingRect,
    const Rect& targetBoundingRect,
    const ShadowNodeFamily::AncestorList& targetToRootAncestors,
    bool hasExplicitRoot) {
  // Use intersectOrNull to properly distinguish between edge-adjacent
  // (valid intersection) and separated rectangles (no intersection)
  auto absoluteIntersectionRect =
      intersectOrNull(rootBoundingRect, targetBoundingRect);
  if (!absoluteIntersectionRect.has_value()) {
    return std::nullopt;
  }

  // Coordinates of the target after clipping the parts hidden by a parent,
  // until till the root (e.g.: in scroll views, or in views with a parent with
  // overflow: hidden)
  auto clippedTargetFromRoot =
      getClippedTargetBoundingRect(targetToRootAncestors);

  auto clippedTargetBoundingRect = hasExplicitRoot ? Rect{
      .origin=rootBoundingRect.origin + clippedTargetFromRoot.origin,
      .size=clippedTargetFromRoot.size}
      : clippedTargetFromRoot;

  return intersectOrNull(rootBoundingRect, clippedTargetBoundingRect);
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
  bool hasExplicitRoot = observationRootShadowNodeFamily_.has_value();

  auto rootAncestors = hasExplicitRoot
      ? observationRootShadowNodeFamily_.value()->getAncestors(rootShadowNode)
      : ShadowNodeFamily::AncestorList{};

  // Absolute coordinates of the root
  auto rootBoundingRect = hasExplicitRoot
      ? getBoundingRect(rootAncestors)
      : getRootNodeBoundingRect(rootShadowNode);

  auto targetAncestors = targetShadowNodeFamily_->getAncestors(rootShadowNode);

  // Absolute coordinates of the target
  auto targetBoundingRect = getBoundingRect(targetAncestors);

  if ((hasExplicitRoot && rootAncestors.empty()) || targetAncestors.empty()) {
    // If observation root or target is not a descendant of `rootShadowNode`
    return setNotIntersectingState(
        rootBoundingRect, targetBoundingRect, {}, time);
  }

  auto targetToRootAncestors = hasExplicitRoot
      ? targetShadowNodeFamily_->getAncestors(*getShadowNode(rootAncestors))
      : targetAncestors;

  auto intersection = computeIntersection(
      rootBoundingRect,
      targetBoundingRect,
      targetToRootAncestors,
      hasExplicitRoot);

  auto intersectionRect =
      intersection.has_value() ? intersection.value() : Rect{};

  Float targetBoundingRectArea =
      targetBoundingRect.size.width * targetBoundingRect.size.height;
  auto intersectionRectArea =
      intersectionRect.size.width * intersectionRect.size.height;

  Float intersectionRatio =
      targetBoundingRectArea == 0 // prevent division by zero
      ? 0
      : intersectionRectArea / targetBoundingRectArea;

  if (!intersection.has_value()) {
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
        .intersectionObserverId = intersectionObserverId_,
        .shadowNodeFamily = targetShadowNodeFamily_,
        .targetRect = targetBoundingRect,
        .rootRect = rootBoundingRect,
        .intersectionRect = intersectionRect,
        .isIntersectingAboveThresholds = true,
        .time = time,
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
        .intersectionObserverId = intersectionObserverId_,
        .shadowNodeFamily = targetShadowNodeFamily_,
        .targetRect = targetBoundingRect,
        .rootRect = rootBoundingRect,
        .intersectionRect = intersectionRect,
        .isIntersectingAboveThresholds = false,
        .time = time,
    };
    return std::optional<IntersectionObserverEntry>(std::move(entry));
  }

  return std::nullopt;
}

} // namespace facebook::react
