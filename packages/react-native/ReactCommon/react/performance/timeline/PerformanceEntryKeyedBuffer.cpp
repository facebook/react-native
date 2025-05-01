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
  auto name =
      std::visit([](const auto& entryData) { return entryData.name; }, entry);

  auto node = entryMap_.find(name);

  if (node != entryMap_.end()) {
    node->second.push_back(entry);
  } else {
    entryMap_.emplace(name, std::vector<PerformanceEntry>{entry});
  }
}

void PerformanceEntryKeyedBuffer::getEntries(
    std::vector<PerformanceEntry>& target) const {
  for (const auto& [_, entries] : entryMap_) {
    target.insert(target.end(), entries.begin(), entries.end());
  }
}

void PerformanceEntryKeyedBuffer::getEntries(
    std::vector<PerformanceEntry>& target,
    const std::string& name) const {
  std::string nameStr{name};

  if (auto node = entryMap_.find(nameStr); node != entryMap_.end()) {
    target.insert(target.end(), node->second.begin(), node->second.end());
  }
}

void PerformanceEntryKeyedBuffer::clear() {
  entryMap_.clear();
}

void PerformanceEntryKeyedBuffer::clear(const std::string& name) {
  entryMap_.erase(name);
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
