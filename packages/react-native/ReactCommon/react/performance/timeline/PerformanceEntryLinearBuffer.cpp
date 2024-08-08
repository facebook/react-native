/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
*/

#include "PerformanceEntryLinearBuffer.h"
#include <string>

namespace facebook::react {

void PerformanceEntryLinearBuffer::add(const PerformanceEntry& entry) {
  entries_.push_back(entry);
}

void PerformanceEntryLinearBuffer::consume(std::vector<PerformanceEntry>& target) {
  target.reserve(entries_.size());
}

std::vector<PerformanceEntry> PerformanceEntryLinearBuffer::consume() {
  std::vector elements = entries_;
  entries_.clear();
  return elements;
}

size_t PerformanceEntryLinearBuffer::pendingMessagesCount() const {
  return entries_.size();
}

void PerformanceEntryLinearBuffer::getEntries(
    std::optional<std::string_view> name,
    std::vector<PerformanceEntry>& target) const {
  if (name.has_value()) {
    std::copy_if(
        entries_.begin(),
        entries_.end(),
        target.begin(),
        [&name](const PerformanceEntry& entry) {
          return entry.name == name.value();
        });
  }
  else {
    std::copy(entries_.begin(), entries_.end(), target.begin());
  }
}

void PerformanceEntryLinearBuffer::clear() {
  entries_.clear();
}

void PerformanceEntryLinearBuffer::clear(std::string_view name) {
  entries_.erase(
      std::remove_if(
          entries_.begin(),
          entries_.end(),
          [&name](const PerformanceEntry& entry) { return entry.name == name; }),
      entries_.end());
}

std::vector<PerformanceEntry>& PerformanceEntryLinearBuffer::getEntries() {
  return entries_;
}

} // namespace facebook::react
