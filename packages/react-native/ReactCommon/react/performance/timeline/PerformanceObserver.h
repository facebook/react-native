/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <unordered_set>
#include <vector>
#include "PerformanceEntryLinearBuffer.h"

namespace facebook::react {

using PerformanceObserverEntryTypeFilter = std::unordered_set<PerformanceEntryType>;
using PerformanceObserverCallback = std::function<void(std::vector<PerformanceEntry>, size_t)>;

class PerformanceObserverRegistry;

/**
 * Represents native counterpart of performance timeline PerformanceObserver
 * class. Each instance has its own entry buffer and can listen for different
 * performance entry types.
 *
 * Entries are pushed to the observer by the `PerformanceEntryReporter` class,
 * through the `PerformanceObserverRegistry` class which acts as a central hub.
 */
class PerformanceObserver {
 public:
  explicit PerformanceObserver(
      PerformanceObserverCallback&& callback)
      : callback_(std::move(callback)) {}

  virtual ~PerformanceObserver();

  /**
   * Append entry to the buffer if this observer should handle this entry.
   */
  void handleEntry(const PerformanceEntry& entry);

  /**
   * Returns current observer buffer and clears it.
   *
   * Spec:
   *  https://w3c.github.io/performance-timeline/#takerecords-method
   */
  [[nodiscard]] std::vector<PerformanceEntry> takeRecords();

  /**
   * Configures the observer to watch for specified entry type.
   *
   * This operation resets and overrides previous configurations. So consecutive
   * calls to this methods remove any previous watch configuration (as per spec).
   */
  void observe(PerformanceEntryType type, bool buffered);

  /**
   * Configures the observer to watch for specified entry type.
   *
   * This operation resets and overrides previous configurations. So consecutive
   * calls to this methods remove any previous watch configuration (as per spec).
   */
  void observe(std::unordered_set<PerformanceEntryType> types);

private:
  const PerformanceEntryBuffer& getBuffer() const {
    return buffer_;
  }

  void scheduleFlushBuffer();

  std::weak_ptr<PerformanceObserverRegistry> registry_;
  PerformanceObserverCallback callback_;
  PerformanceObserverEntryTypeFilter observedTypes_;
  PerformanceEntryLinearBuffer buffer_;
  bool requiresDroppedEntries_ = false;
};

inline bool operator==(const PerformanceObserver& lhs, const PerformanceObserver& rhs) {
  return &lhs == &rhs;
}

} // namespace facebook::react
