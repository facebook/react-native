/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>
#include <vector>
#include "IntersectionObserver.h"

namespace facebook::react {

class IntersectionObserverManager final : public UIManagerMountHook {
 public:
  IntersectionObserverManager();

  void observe(
      IntersectionObserverObserverId intersectionObserverId,
      const ShadowNode::Shared& shadowNode,
      std::vector<Float> thresholds,
      const UIManager& uiManager);

  void unobserve(
      IntersectionObserverObserverId intersectionObserverId,
      const ShadowNode& shadowNode);

  void connect(
      UIManager& uiManager,
      std::function<void()> notifyIntersectionObserversCallback);

  void disconnect(UIManager& uiManager);

  std::vector<IntersectionObserverEntry> takeRecords();

#pragma mark - UIManagerMountHook

  void shadowTreeDidMount(
      const RootShadowNode::Shared& rootShadowNode,
      double time) noexcept override;

  void shadowTreeDidUnmount(SurfaceId surfaceId, double time) noexcept override;

 private:
  mutable std::unordered_map<SurfaceId, std::vector<IntersectionObserver>>
      observersBySurfaceId_;
  mutable std::shared_mutex observersMutex_;

  mutable std::function<void()> notifyIntersectionObserversCallback_;

  mutable std::vector<IntersectionObserverEntry> pendingEntries_;
  mutable std::mutex pendingEntriesMutex_;

  mutable bool notifiedIntersectionObservers_{};
  mutable bool mountHookRegistered_{};

  void notifyObserversIfNecessary();
  void notifyObservers();

  // Equivalent to
  // https://w3c.github.io/IntersectionObserver/#update-intersection-observations-algo
  void updateIntersectionObservations(
      SurfaceId surfaceId,
      const RootShadowNode* rootShadowNode,
      double time);

  const IntersectionObserver& getRegisteredIntersectionObserver(
      SurfaceId surfaceId,
      IntersectionObserverObserverId observerId) const;
};

} // namespace facebook::react
