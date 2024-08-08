/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceObserver.h"
#include "PerformanceObserverRegistry.h"
#include "PerformanceEntryReporter.h"

namespace facebook::react {

PerformanceObserver::~PerformanceObserver() {
  if (auto registry = registry_.lock()) {
    registry->removeObserver(*this);
  }
}

void PerformanceObserver::pushEntry(const PerformanceEntry& entry) {
  buffer_.add(entry);
}

std::vector<PerformanceEntry> PerformanceObserver::takeRecords() {
  return buffer_.consume();
}

bool PerformanceObserver::isObserving(PerformanceEntryType type) const {
  return observedTypes_.contains(type);
}

void PerformanceObserver::observe(PerformanceEntryType type, bool buffered) {
  // we assume that `type` was checked on JS side and is correct
  observedTypes_.clear();
  observedTypes_.insert(type);

  requiresDroppedEntries_ = true;

  if (buffered) {
    auto& reporter = PerformanceEntryReporter::getInstance();
    reporter->getBuffer(type).getEntries(std::nullopt, buffer_.getEntries());
    scheduleFlushBuffer();
  }
}

void PerformanceObserver::observe(std::unordered_set<PerformanceEntryType> types) {
  observedTypes_ = std::move(types);
  requiresDroppedEntries_ = true;
}

bool PerformanceObserver::shouldAdd(const PerformanceEntry& entry) const {
  return buffer_.shouldAdd(entry);
}

void PerformanceObserver::scheduleFlushBuffer() {
  if (!callback_) {
    return;
  }

  auto droppedEntriesCount = 0;

  if (requiresDroppedEntries_) {
    auto reporter = PerformanceEntryReporter::getInstance();

    for (auto& entry : observedTypes_) {
      droppedEntriesCount += reporter->getBuffer(entry).droppedEntriesCount;
    }

    requiresDroppedEntries_ = false;
  }

  callback_(takeRecords(), droppedEntriesCount);
}

} // namespace facebook::react
