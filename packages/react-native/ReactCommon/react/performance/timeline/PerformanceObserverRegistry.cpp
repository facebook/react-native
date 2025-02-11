/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceObserverRegistry.h"
#include "PerformanceObserver.h"

namespace facebook::react {

void PerformanceObserverRegistry::addObserver(
    std::shared_ptr<PerformanceObserver> observer) {
  std::lock_guard guard(observersMutex_);
  observers_.insert(observer);
}

void PerformanceObserverRegistry::removeObserver(
    std::shared_ptr<PerformanceObserver> observer) {
  std::lock_guard guard(observersMutex_);
  observers_.erase(observer);
}

void PerformanceObserverRegistry::queuePerformanceEntry(
    const PerformanceEntry& entry) {
  std::lock_guard lock(observersMutex_);

  for (auto& observer : observers_) {
    observer->handleEntry(entry);
  }
}

} // namespace facebook::react
