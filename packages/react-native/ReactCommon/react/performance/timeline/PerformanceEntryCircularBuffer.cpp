/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryCircularBuffer.h"

namespace facebook::react {

void PerformanceEntryCircularBuffer::add(const facebook::react::PerformanceEntry& entry) {
  auto result = entries_.add(std::move(entry));
  if (result == BoundedConsumableBuffer<PerformanceEntry>::PushStatus::DROP) {
    droppedEntriesCount += 1;
  }
}

void PerformanceEntryCircularBuffer::consume(std::vector<PerformanceEntry>& target) {
  entries_.consume(target);
}

void PerformanceEntryCircularBuffer::getEntries(std::optional<std::string_view> name, std::vector<PerformanceEntry>& target) const {
  entries_.getEntries(
      target, [&](const PerformanceEntry& e) { return e.name == name; });
}

void PerformanceEntryCircularBuffer::clear() {
  entries_.clear();
}


void PerformanceEntryCircularBuffer::clear(std::string_view name) {
  entries_.clear([&](const PerformanceEntry& e) { return e.name == name; });
}

} // namespace facebook::react
