/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryKeyedBuffer.h"
#include <string>

namespace facebook::react {

void PerformanceEntryKeyedBuffer::add(const PerformanceEntry& entry) {
  auto& list = entryMap_.at(entry.name);
  list.push_back(entry);
  totalEntryCount_ += 1;
}

void PerformanceEntryKeyedBuffer::getEntries(
    std::vector<PerformanceEntry>& target) const {
  std::vector<PerformanceEntry> allEntries;
  // pre-allocate result vector
  allEntries.reserve(totalEntryCount_);

  for (const auto& [_, entries] : entryMap_) {
    allEntries.insert(allEntries.end(), entries.begin(), entries.end());
  }

  std::stable_sort(
      allEntries.begin(), allEntries.end(), PerformanceEntrySorter{});
  target.insert(target.end(), allEntries.begin(), allEntries.end());
}

void PerformanceEntryKeyedBuffer::getEntries(
    std::string_view name,
    std::vector<PerformanceEntry>& target) const {
  std::string nameStr{name};

  if (auto node = entryMap_.find(nameStr); node != entryMap_.end()) {
    target.insert(target.end(), node->second.begin(), node->second.end());
  }
}

void PerformanceEntryKeyedBuffer::clear() {
  entryMap_.clear();
  totalEntryCount_ = 0;
}

void PerformanceEntryKeyedBuffer::clear(std::string_view nameView) {
  std::string name{nameView};

  if (auto node = entryMap_.find(name); node != entryMap_.end()) {
    totalEntryCount_ -= node->second.size();
    entryMap_.erase(node);
  }
}

std::optional<PerformanceEntry> PerformanceEntryKeyedBuffer::find(
    const std::string& name) const {
  if (auto node = entryMap_.find(name); node != entryMap_.end()) {
    if (!node->second.empty()) {
      return std::make_optional<PerformanceEntry>(node->second.back());
    }
  }

  return std::nullopt;
}

} // namespace facebook::react
