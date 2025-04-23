/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryCircularBuffer.h"

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
  buffer_.getEntries(
      target, [&](const PerformanceEntry& e) { return e.name == name; });
}

void PerformanceEntryCircularBuffer::clear() {
  buffer_.clear();
}

void PerformanceEntryCircularBuffer::clear(const std::string& name) {
  buffer_.clear([&](const PerformanceEntry& e) { return e.name == name; });
}

} // namespace facebook::react
