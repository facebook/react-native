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
#include "PerformanceEntryBuffer.h"

namespace facebook::react {

using PerformanceObserverEventFilter = std::unordered_set<PerformanceEntryType>;
using PerformanceObserverCallback = std::function<void(size_t)>;

class PerformanceObserverRegistry;

/**
 * Represents native counterpart of performance timeline PerformanceObserver
 * class. Each instance has its own entry buffer and can listen for different
 * performance entry types.
 *
 * Entries are pushed to the observer by the `PerformanceEntryReporter` class,
 * which acts as a central hub.
 */
class PerformanceObserver {
 public:
  struct PopPendingEntriesResult {
    std::vector<PerformanceEntry> entries;
    uint32_t droppedEntriesCount;
  };

  PerformanceObserver(
      PerformanceObserverCallback callback,
      PerformanceEntryType type)
      : callback_(std::move(callback)), observedTypes_({type}) {}
  PerformanceObserver(
      PerformanceObserverCallback callback,
      PerformanceObserverEventFilter&& types)
      : callback_(std::move(callback)), observedTypes_(std::move(types)) {}

  virtual ~PerformanceObserver();

  void logEntry(const PerformanceEntry& entry);
  PopPendingEntriesResult popPendingEntries();
  void clearEntries(
      std::optional<PerformanceEntryType> entryType = std::nullopt,
      std::string_view entryName = {});

  bool isObserving(PerformanceEntryType type) const;
  PerformanceObserverEventFilter& getEventFilter();
  const PerformanceObserverEventFilter& getEventFilter() const;

  void setEntryBuffering(bool isBuffered);
  void setDurationThreshold(double durationThreshold);

 private:
  void scheduleFlushBuffer();

  std::weak_ptr<PerformanceObserverRegistry> registry_;
  PerformanceObserverCallback callback_;
  PerformanceObserverEventFilter observedTypes_;
  size_t droppedEntriesCount_{0};
  PerformanceEntryCircularBuffer buffer_{DEFAULT_MAX_BUFFER_SIZE};
};

} // namespace facebook::react
