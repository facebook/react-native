/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceObserverRegistry.h"

namespace facebook::react {

PerformanceObserver::Ptr PerformanceObserverRegistry::createObserver(PerformanceObserverCallback&& callback) {
  // We allocate observer manually, and use `shared_ptr` deleter
  // functionality to remove observer from registry
  auto obj = new PerformanceObserver(std::move(callback));
  auto deleter = [&](PerformanceObserver* observer) -> void {
    this->removeObserver(*obj);
    delete observer;
  };
  PerformanceObserver::Ptr ptr {obj, deleter};
  return ptr;
}

void PerformanceObserverRegistry::addObserver(const PerformanceObserver::WeakPtr& observer) {
  std::lock_guard guard{observersMutex_};
  observers_.insert(observer);
}

void PerformanceObserverRegistry::removeObserver(const PerformanceObserver& observer) {
  std::lock_guard guard{observersMutex_};
  erase_if(observers_, [&](auto e) -> bool {
    return !e.expired() && *e.lock() == observer;
  });
}

void PerformanceObserverRegistry::removeObserver(const PerformanceObserver::Ptr& observer) {
  std::lock_guard guard{observersMutex_};
  observers_.erase(observer);
}

void PerformanceObserverRegistry::queuePerformanceEntry(const PerformanceEntry& entry) {
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
      observer->handleEntry(entry);
    }
  }
}

} // namespace facebook::react
