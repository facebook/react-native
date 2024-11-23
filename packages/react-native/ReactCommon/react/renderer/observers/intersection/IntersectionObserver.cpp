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
    ShadowNode::Shared targetShadowNode,
    std::vector<Float> thresholds,
    std::optional<std::vector<Float>> rootThresholds)
    : intersectionObserverId_(intersectionObserverId),
      targetShadowNode_(std::move(targetShadowNode)),
      thresholds_(std::move(thresholds)),
      rootThresholds_(std::move(rootThresholds)) {}

static Rect getRootBoundingRect(
    const LayoutableShadowNode& layoutableRootShadowNode) {
  auto layoutMetrics = layoutableRootShadowNode.getLayoutMetrics();

  if (layoutMetrics == EmptyLayoutMetrics ||
      layoutMetrics.displayType == DisplayType::None) {
    return Rect{};
  }

  // Apply the transform to translate the root view to its location in the
  // viewport.
  return layoutMetrics.frame * layoutableRootShadowNode.getTransform();
}

static Rect getTargetBoundingRect(
    const ShadowNodeFamily::AncestorList& targetAncestors) {
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      targetAncestors,
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
    const ShadowNodeFamily::AncestorList& targetAncestors) {
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

  // Coordinates of the target after clipping the parts hidden by a parent
  // (e.g.: in scroll views, or in views with a parent with overflow: hidden)
  auto clippedTargetBoundingRect =
      getClippedTargetBoundingRect(targetAncestors);

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
    double time) {
  const auto layoutableRootShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(&rootShadowNode);

  react_native_assert(
      layoutableRootShadowNode != nullptr &&
      "RootShadowNode instances must always inherit from LayoutableShadowNode.");

  auto targetAncestors =
      targetShadowNode_->getFamily().getAncestors(rootShadowNode);

  // Absolute coordinates of the root
  auto rootBoundingRect = getRootBoundingRect(*layoutableRootShadowNode);

  // Absolute coordinates of the target
  auto targetBoundingRect = getTargetBoundingRect(targetAncestors);

  auto intersectionRect = computeIntersection(
      rootBoundingRect, targetBoundingRect, targetAncestors);

  Float targetBoundingRectArea =
      targetBoundingRect.size.width * targetBoundingRect.size.height;
  auto intersectionRectArea =
      intersectionRect.size.width * intersectionRect.size.height;

  Float intersectionRatio =
      targetBoundingRectArea == 0 // prevent division by zero
      ? 0
      : intersectionRectArea / targetBoundingRectArea;

  if (intersectionRatio == 0) {
    return setNotIntersectingState(rootBoundingRect, targetBoundingRect, time);
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
    return setNotIntersectingState(rootBoundingRect, targetBoundingRect, time);
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
    double time) {
  return setNotIntersectingState(Rect{}, Rect{}, time);
}

std::optional<IntersectionObserverEntry>
IntersectionObserver::setIntersectingState(
    const Rect& rootBoundingRect,
    const Rect& targetBoundingRect,
    const Rect& intersectionRect,
    Float threshold,
    Float rootThreshold,
    double time) {
  auto newState =
      IntersectionObserverState::Intersecting(threshold, rootThreshold);

  if (state_ != newState) {
    state_ = newState;
    IntersectionObserverEntry entry{
        intersectionObserverId_,
        targetShadowNode_,
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
    double time) {
  if (state_ != IntersectionObserverState::NotIntersecting()) {
    state_ = IntersectionObserverState::NotIntersecting();
    IntersectionObserverEntry entry{
        intersectionObserverId_,
        targetShadowNode_,
        targetBoundingRect,
        rootBoundingRect,
        std::nullopt,
        false,
        time,
    };
    return std::optional<IntersectionObserverEntry>(std::move(entry));
  }

  return std::nullopt;
}

} // namespace facebook::react
