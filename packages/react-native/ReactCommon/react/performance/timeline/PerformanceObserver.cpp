/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceObserver.h"
#include "PerformanceEntryReporter.h"

namespace facebook::react {

void PerformanceObserver::handleEntry(const PerformanceEntry& entry) {
  if (observedTypes_.contains(entry.entryType)) {
    // https://www.w3.org/TR/event-timing/#should-add-performanceeventtiming
    if (entry.entryType == PerformanceEntryType::EVENT &&
        entry.duration < durationThreshold_) {
      // The entries duration is lower than the desired reporting threshold,
      // skip
      return;
    }

    buffer_.push_back(entry);
    scheduleFlushBuffer();
  }
}

std::vector<PerformanceEntry> PerformanceObserver::takeRecords() {
  std::vector<PerformanceEntry> result;
  buffer_.swap(result);

  didScheduleFlushBuffer_ = false;

  return result;
}

void PerformanceObserver::observe(
    PerformanceEntryType type,
    PerformanceObserverObserveSingleOptions options) {
  observedTypes_.insert(type);

  durationThreshold_ = options.durationThreshold;
  requiresDroppedEntries_ = true;

  if (options.buffered) {
    auto& reporter = PerformanceEntryReporter::getInstance();

    auto bufferedEntries = reporter->getEntries(type);
    for (auto& bufferedEntry : bufferedEntries) {
      handleEntry(bufferedEntry);
    }
  }

  registry_.addObserver(shared_from_this());
}

void PerformanceObserver::observe(
    std::unordered_set<PerformanceEntryType> types) {
  observedTypes_ = std::move(types);
  requiresDroppedEntries_ = false;
  registry_.addObserver(shared_from_this());
}

uint32_t PerformanceObserver::getDroppedEntriesCount() noexcept {
  uint32_t droppedEntriesCount = 0;

  if (requiresDroppedEntries_) {
    auto reporter = PerformanceEntryReporter::getInstance();

    for (auto& entryType : observedTypes_) {
      droppedEntriesCount += reporter->getDroppedEntriesCount(entryType);
    }

    requiresDroppedEntries_ = false;
  }

  return droppedEntriesCount;
}

void PerformanceObserver::disconnect() noexcept {
  registry_.removeObserver(shared_from_this());
}

void PerformanceObserver::scheduleFlushBuffer() {
  if (!didScheduleFlushBuffer_) {
    didScheduleFlushBuffer_ = true;

    callback_();
  }
}

} // namespace facebook::react
