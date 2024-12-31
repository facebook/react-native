/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Rect.h>
#include <memory>
#include "IntersectionObserverState.h"

namespace facebook::react {

using IntersectionObserverObserverId = int32_t;

struct IntersectionObserverEntry {
  IntersectionObserverObserverId intersectionObserverId;
  ShadowNode::Shared shadowNode;
  Rect targetRect;
  Rect rootRect;
  Rect intersectionRect;
  bool isIntersectingAboveThresholds;
  // TODO(T156529385) Define `DOMHighResTimeStamp` as an alias for `double` and
  // use it here.
  double time;
};

class IntersectionObserver {
 public:
  IntersectionObserver(
      IntersectionObserverObserverId intersectionObserverId,
      ShadowNode::Shared targetShadowNode,
      std::vector<Float> thresholds,
      std::optional<std::vector<Float>> rootThresholds = std::nullopt);

  // Partially equivalent to
  // https://w3c.github.io/IntersectionObserver/#update-intersection-observations-algo
  std::optional<IntersectionObserverEntry> updateIntersectionObservation(
      const RootShadowNode& rootShadowNode,
      double time);

  std::optional<IntersectionObserverEntry>
  updateIntersectionObservationForSurfaceUnmount(double time);

  IntersectionObserverObserverId getIntersectionObserverId() const {
    return intersectionObserverId_;
  }

  const ShadowNode& getTargetShadowNode() const {
    return *targetShadowNode_;
  }

  std::vector<Float> getThresholds() const {
    return thresholds_;
  }

 private:
  std::optional<IntersectionObserverEntry> setIntersectingState(
      const Rect& rootBoundingRect,
      const Rect& targetBoundingRect,
      const Rect& intersectionRect,
      Float threshold,
      Float rootThreshold,
      double time);

  std::optional<IntersectionObserverEntry> setNotIntersectingState(
      const Rect& rootBoundingRect,
      const Rect& targetBoundingRect,
      const Rect& intersectionRect,
      double time);

  IntersectionObserverObserverId intersectionObserverId_;
  ShadowNode::Shared targetShadowNode_;
  std::vector<Float> thresholds_;
  std::optional<std::vector<Float>> rootThresholds_;
  mutable IntersectionObserverState state_ =
      IntersectionObserverState::Initial();
};

} // namespace facebook::react
