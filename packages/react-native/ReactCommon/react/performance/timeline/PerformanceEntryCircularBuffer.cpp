/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryCircularBuffer.h"

namespace facebook::react {

void PerformanceEntryCircularBuffer::add(const facebook::react::PerformanceEntry& entry) {
  auto result = entries.add(std::move(entry));
  if (result == BoundedConsumableBuffer<PerformanceEntry>::PushStatus::DROP) {
    droppedEntriesCount += 1;
  }
}

void PerformanceEntryCircularBuffer::consume(std::vector<PerformanceEntry>& target) {
  entries.consume(target);
}

size_t PerformanceEntryCircularBuffer::pendingMessagesCount() const {
  return entries.getNumToConsume();
}

void PerformanceEntryCircularBuffer::getEntries(std::optional<std::string_view> name, std::vector<PerformanceEntry>& target) const {
  entries.getEntries(
      target, [&](const PerformanceEntry& e) { return e.name == name; });
}

void PerformanceEntryCircularBuffer::clear() {
  entries.clear();
}


void PerformanceEntryCircularBuffer::clear(std::string_view name) {
  entries.clear([&](const PerformanceEntry& e) { return e.name == name; });
}

} // namespace facebook::react
