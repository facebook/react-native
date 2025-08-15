/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryCircularBuffer.h"

#include <variant>

namespace facebook::react {

void PerformanceEntryCircularBuffer::add(const PerformanceEntry& entry) {
  if (buffer_.add(entry)) {
    droppedEntriesCount += 1;
  }
}

void PerformanceEntryCircularBuffer::getEntries(
    std::vector<PerformanceEntry>& target) const {
  buffer_.getEntries(target);
}

void PerformanceEntryCircularBuffer::getEntries(
    std::vector<PerformanceEntry>& target,
    const std::string& name) const {
  buffer_.getEntries(target, [&](const PerformanceEntry& entry) {
    return std::visit(
        [&name](const auto& entryData) { return entryData.name == name; },
        entry);
  });
}

void PerformanceEntryCircularBuffer::clear() {
  buffer_.clear();
}

void PerformanceEntryCircularBuffer::clear(const std::string& name) {
  buffer_.clear([&](const PerformanceEntry& entry) {
    return std::visit(
        [&name](const auto& entryData) { return entryData.name == name; },
        entry);
  });
}

} // namespace facebook::react
