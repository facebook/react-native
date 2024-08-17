/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "IntersectionObserverManager.h"
#include <cxxreact/JSExecutor.h>
#include <cxxreact/SystraceSection.h>
#include <utility>
#include "IntersectionObserver.h"

namespace facebook::react {

IntersectionObserverManager::IntersectionObserverManager() = default;

void IntersectionObserverManager::observe(
    IntersectionObserverObserverId intersectionObserverId,
    const ShadowNode::Shared& shadowNode,
    std::vector<Float> thresholds,
    const UIManager& uiManager) {
  SystraceSection s("IntersectionObserverManager::observe");

  auto surfaceId = shadowNode->getSurfaceId();

  // The actual observer lives in the array, so we need to create it there and
  // then get a reference. Otherwise we only update its state in a copy.
  IntersectionObserver* observer;

  // Register observer
  {
    std::unique_lock lock(observersMutex_);

    auto& observers = observersBySurfaceId_[surfaceId];
    observers.emplace_back(IntersectionObserver{
        intersectionObserverId, shadowNode, std::move(thresholds)});
    observer = &observers.back();
  }

  // Notification of initial state.
  // Ideally, we'd have well defined event loop step to notify observers
  // (like on the Web) and we'd send the initial notification there, but as
  // we don't have it we have to run this check once and manually dispatch.
  auto& shadowTreeRegistry = uiManager.getShadowTreeRegistry();
  MountingCoordinator::Shared mountingCoordinator = nullptr;
  RootShadowNode::Shared rootShadowNode = nullptr;
  shadowTreeRegistry.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    mountingCoordinator = shadowTree.getMountingCoordinator();
    rootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
  });

  // If the surface doesn't exist for some reason, we skip initial notification.
  if (!rootShadowNode) {
    return;
  }

  auto hasPendingTransactions = mountingCoordinator != nullptr &&
      mountingCoordinator->hasPendingTransactions();

  if (!hasPendingTransactions) {
    auto entry = observer->updateIntersectionObservation(
        *rootShadowNode, JSExecutor::performanceNow());
    if (entry) {
      {
        std::unique_lock lock(pendingEntriesMutex_);
        pendingEntries_.push_back(std::move(entry).value());
      }
      notifyObserversIfNecessary();
    }
  }
}

void IntersectionObserverManager::unobserve(
    IntersectionObserverObserverId intersectionObserverId,
    const ShadowNode& shadowNode) {
  SystraceSection s("IntersectionObserverManager::unobserve");

  {
    std::unique_lock lock(observersMutex_);

    auto surfaceId = shadowNode.getSurfaceId();

    auto observersIt = observersBySurfaceId_.find(surfaceId);
    if (observersIt == observersBySurfaceId_.end()) {
      return;
    }

    auto& observers = observersIt->second;

    observers.erase(
        std::remove_if(
            observers.begin(),
            observers.end(),
            [intersectionObserverId, &shadowNode](const auto& observer) {
              return observer.getIntersectionObserverId() ==
                  intersectionObserverId &&
                  ShadowNode::sameFamily(
                         observer.getTargetShadowNode(), shadowNode);
            }),
        observers.end());

    if (observers.empty()) {
      observersBySurfaceId_.erase(surfaceId);
    }
  }

  {
    std::unique_lock lock(pendingEntriesMutex_);

    pendingEntries_.erase(
        std::remove_if(
            pendingEntries_.begin(),
            pendingEntries_.end(),
            [intersectionObserverId, &shadowNode](const auto& entry) {
              return entry.intersectionObserverId == intersectionObserverId &&
                  ShadowNode::sameFamily(*entry.shadowNode, shadowNode);
            }),
        pendingEntries_.end());
  }
}

void IntersectionObserverManager::connect(
    UIManager& uiManager,
    std::function<void()> notifyIntersectionObserversCallback) {
  SystraceSection s("IntersectionObserverManager::connect");
  notifyIntersectionObserversCallback_ =
      std::move(notifyIntersectionObserversCallback);

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (mountHookRegistered_) {
    return;
  }

  uiManager.registerMountHook(*this);
  mountHookRegistered_ = true;
}

void IntersectionObserverManager::disconnect(UIManager& uiManager) {
  SystraceSection s("IntersectionObserverManager::disconnect");

  // Fail-safe in case the caller doesn't guarantee consistency.
  if (!mountHookRegistered_) {
    return;
  }

  uiManager.unregisterMountHook(*this);
  mountHookRegistered_ = false;
  notifyIntersectionObserversCallback_ = nullptr;
}

std::vector<IntersectionObserverEntry>
IntersectionObserverManager::takeRecords() {
  std::unique_lock lock(pendingEntriesMutex_);

  notifiedIntersectionObservers_ = false;

  std::vector<IntersectionObserverEntry> entries;
  pendingEntries_.swap(entries);
  return entries;
}

void IntersectionObserverManager::shadowTreeDidMount(
    const RootShadowNode::Shared& rootShadowNode,
    double mountTime) noexcept {
  updateIntersectionObservations(*rootShadowNode, mountTime);
}

void IntersectionObserverManager::updateIntersectionObservations(
    const RootShadowNode& rootShadowNode,
    double mountTime) {
  SystraceSection s(
      "IntersectionObserverManager::updateIntersectionObservations");

  std::vector<IntersectionObserverEntry> entries;

  // Run intersection observations
  {
    std::shared_lock lock(observersMutex_);

    auto surfaceId = rootShadowNode.getSurfaceId();

    auto observersIt = observersBySurfaceId_.find(surfaceId);
    if (observersIt == observersBySurfaceId_.end()) {
      return;
    }

    auto& observers = observersIt->second;
    for (auto& observer : observers) {
      auto entry =
          observer.updateIntersectionObservation(rootShadowNode, mountTime);
      if (entry) {
        entries.push_back(std::move(entry).value());
      }
    }
  }

  {
    std::unique_lock lock(pendingEntriesMutex_);
    pendingEntries_.insert(
        pendingEntries_.end(), entries.begin(), entries.end());
  }

  notifyObserversIfNecessary();
}

/**
 * This method allows us to avoid scheduling multiple calls to notify observers
 * in the JS thread. We schedule one and skip subsequent ones (we just append
 * the entries to the pending list and wait for the scheduled task to consume
 * all of them).
 */
void IntersectionObserverManager::notifyObserversIfNecessary() {
  bool dispatchNotification = false;

  {
    std::unique_lock lock(pendingEntriesMutex_);

    if (!pendingEntries_.empty() && !notifiedIntersectionObservers_) {
      notifiedIntersectionObservers_ = true;
      dispatchNotification = true;
    }
  }

  if (dispatchNotification) {
    notifyObservers();
  }
}

void IntersectionObserverManager::notifyObservers() {
  SystraceSection s("IntersectionObserverManager::notifyObservers");
  notifyIntersectionObserversCallback_();
}

} // namespace facebook::react
