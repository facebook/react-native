/*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#include "PerformanceObserver.h"
#include "PerformanceObserverRegistry.h"

namespace facebook::react {

PerformanceObserver::~PerformanceObserver() {
  if (auto registry = registry_.lock()) {
    registry->removeObserver(*this);
  }
}

void PerformanceObserver::pushEntry(const facebook::react::PerformanceEntry& entry) {
  auto pushResult = buffer_.add(entry);
  if (pushResult ==
      BoundedConsumableBuffer<PerformanceEntry>::PushStatus::DROP) {
    // Start dropping entries once reached maximum buffer size.
    // The number of dropped entries will be reported back to the corresponding
    // PerformanceObserver callback.
    droppedEntriesCount_ += 1;
  }

  if (buffer_.pendingMessagesCount() == 1) {
    // If the buffer was empty, it signals that JS side just has possibly
    // consumed it and is ready to get more
    scheduleFlushBuffer();
  }
}

PerformanceObserver::PopPendingEntriesResult
PerformanceObserver::popPendingEntries() {
  PopPendingEntriesResult res = {
      .entries = std::vector<PerformanceEntry>(),
      .droppedEntriesCount = (uint32_t)droppedEntriesCount_};

  buffer_.consume(res.entries);

  // Sort by starting time (or ending time, if starting times are equal)
  std::stable_sort(
      res.entries.begin(), res.entries.end(), PerformanceEntrySorter{});

  droppedEntriesCount_ = 0;
  return res;
}

void PerformanceObserver::clearEntries(std::optional<PerformanceEntryType> entryType, std::string_view entryName) {
  if (!entryName.empty()) {
    buffer_.clear(entryName);
  } else {
    buffer_.clear();
  }
}

bool PerformanceObserver::isObserving(facebook::react::PerformanceEntryType type) const {
  return observedTypes_.contains(type);
}

PerformanceObserverEventFilter& PerformanceObserver::getEventFilter() {
  return observedTypes_;
}

void PerformanceObserver::setEntryBuffering(bool isBuffered) {
  buffer_.isAlwaysLogged = isBuffered;
}

void PerformanceObserver::setDurationThreshold(DOMHighResTimeStamp durationThreshold) {
  buffer_.durationThreshold = durationThreshold;
}

void PerformanceObserver::scheduleFlushBuffer() {
  if (callback_) {
    callback_(droppedEntriesCount_);
  }
}

} // namespace facebook::react
