/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceObserverRegistry.h"

namespace facebook::react {

void PerformanceObserverRegistry::addObserver(const std::weak_ptr<PerformanceObserver>& observer) {
  std::lock_guard guard{observersMutex_};
  observers_.insert(observer);
}

void PerformanceObserverRegistry::removeObserver(const PerformanceObserver& observer) {
  std::lock_guard guard{observersMutex_};
  erase_if(observers_, [&](auto e) -> bool {
    return !e.expired() && *e.lock() == observer;
  });
}

void PerformanceObserverRegistry::removeObserver(const std::shared_ptr<PerformanceObserver>& observer) {
  std::lock_guard guard{observersMutex_};
  observers_.erase(observer);
}

void PerformanceObserverRegistry::emit(const facebook::react::PerformanceEntry& entry) {
  std::lock_guard lock(observersMutex_);

  // filter dead observers
  for (auto first = observers_.begin(), last = observers_.end();
       first != last;) {
    if (first->expired())
      first = observers_.erase(first);
    else
      ++first;
  }

  for (auto& observer_ptr : observers_) {
    if (auto observer = observer_ptr.lock()) {
      auto shouldAdd = observer->shouldAdd(entry);
      
      // push to observer if it is contained within its entry type filter
      if (observer->isObserving(entry.entryType) && shouldAdd) {
        observer->append(entry);
      }
    }
  }
}

} // namespace facebook::react
