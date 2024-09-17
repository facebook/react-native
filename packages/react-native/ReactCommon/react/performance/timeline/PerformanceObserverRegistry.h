/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <set>
#include "PerformanceObserver.h"

namespace facebook::react {

/**
 * PerformanceObserverRegistry acts as a container for known performance
 * observer instances.
 *
 * You can queue performance entries through this registry, which then delegates
 * the entry to all registered observers.
 */
class PerformanceObserverRegistry {
 public:
  using Ptr = std::unique_ptr<PerformanceObserverRegistry>;
  using WeakPtr = std::weak_ptr<PerformanceObserverRegistry>;

  PerformanceObserverRegistry() = default;

  /**
   * Creates Performance Observer instance and registers it in the registry.
   *
   * Observer is automatically removed from the registry when it goes out of scope.
   * You can manually remove it from the registry earlier by calling `removeObserver`.
   */
  PerformanceObserver::Ptr createObserver(PerformanceObserverCallback&& callback);

  /**
   * Removes observer from the registry.
   *
   * It is called automatically for observers created by `createObserver` method.
   */
  void removeObserver(const PerformanceObserver::Ptr& observer);

  /**
   * Delegates specified performance `entry` to all registered observers
   * in this registry.
   */
  void queuePerformanceEntry(const PerformanceEntry& entry);

 private:
  void addObserver(const PerformanceObserver::WeakPtr& observer);
  void removeObserver(const PerformanceObserver& observer);

 private:
  mutable std::mutex observersMutex_;
  std::set<PerformanceObserver::WeakPtr, std::owner_less<PerformanceObserver::WeakPtr>> observers_;
};

} // namespace facebook::react
