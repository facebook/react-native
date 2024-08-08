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

class PerformanceObserverRegistry {
 public:
  PerformanceObserverRegistry() = default;

  void addObserver(const std::weak_ptr<PerformanceObserver>& observer);
  void removeObserver(const std::shared_ptr<PerformanceObserver>& observer);
  void removeObserver(const PerformanceObserver& observer);

  void emit(const PerformanceEntry& entry);

 private:
  mutable std::mutex observersMutex_;
  std::set<std::weak_ptr<PerformanceObserver>, std::owner_less<std::weak_ptr<PerformanceObserver>>> observers_;
};

} // namespace facebook::react
