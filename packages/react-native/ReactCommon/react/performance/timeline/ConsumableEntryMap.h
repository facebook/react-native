/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <numeric>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>
#include "PerformanceEntry.h"

namespace facebook::react {

class ConsumableEntryMap {
 public:
  ConsumableEntryMap() = default;

  void add(const PerformanceEntry& entry) {
    auto& list = entryMap_.at(entry.name);
    auto& toConsume = toConsumeMap_.at(entry.name);
    list.push_back(entry);
    totalEntryCount_ += 1;
    totalToConsume_ += 1;
    toConsume += 1;
  }

  void clear() {
    entryMap_.clear();
    toConsumeMap_.clear();
    totalEntryCount_ = 0;
    totalToConsume_ = 0;
  }

  void clear(const std::string& name) {
    if (auto node = entryMap_.find(name); node != entryMap_.end()) {
      totalEntryCount_ -= node->second.size();
      totalToConsume_ -= node->second.size();
      toConsumeMap_[name] = 0;
      node->second.clear();
    }
  }

  std::optional<PerformanceEntry> find(const std::string& name) const {
    if (auto node = entryMap_.find(name); node != entryMap_.end()) {
      if (!node->second.empty()) {
        return std::make_optional<PerformanceEntry>(node->second.back());
      }
    }

    return std::nullopt;
  }

  void getEntries(std::vector<PerformanceEntry>& target) const {
    if (allEntriesCache_.has_value()) {
      auto& allEntries = allEntriesCache_.value();
      target.insert(target.end(), allEntries.begin(), allEntries.end());
      return;
    }

    std::vector<PerformanceEntry> allEntries;
    // pre-allocate result vector
    allEntries.reserve(totalEntryCount_);

    for (const auto& [_, entries] : entryMap_) {
      allEntries.insert(allEntries.end(), entries.begin(), entries.end());
    }

    std::stable_sort(
        allEntries.begin(), allEntries.end(), PerformanceEntrySorter{});
    allEntriesCache_ = allEntries;
    target.insert(target.end(), allEntries.begin(), allEntries.end());
  }

  /**
   * Retrieves buffer entries, whether consumed or not, with predicate
   */
  void consume(std::vector<PerformanceEntry>& target) {
    for (const auto& [name, entries] : entryMap_) {
      target.insert(
          target.end(), entries.end() - toConsumeMap_[name], entries.end());
      toConsumeMap_[name] = 0;
    }
  }

  size_t getNumToConsume() const {
    return totalToConsume_;
  }

  void getEntries(
      const std::string& name,
      std::vector<PerformanceEntry>& target) const {
    if (auto node = entryMap_.find(name); node != entryMap_.end()) {
      target.insert(target.end(), node->second.begin(), node->second.end());
    }
  }

 private:
  std::unordered_map<std::string, std::vector<PerformanceEntry>> entryMap_{};
  std::unordered_map<std::string, size_t> toConsumeMap_{};
  mutable std::optional<std::vector<PerformanceEntry>> allEntriesCache_;
  size_t totalEntryCount_ = 0;
  size_t totalToConsume_ = 0;
};

} // namespace facebook::react
