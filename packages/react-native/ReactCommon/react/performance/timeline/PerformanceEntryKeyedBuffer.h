/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string_view>
#include <unordered_map>
#include "PerformanceEntryBuffer.h"

namespace facebook::react {

class PerformanceEntryKeyedBuffer : public PerformanceEntryBuffer {
 public:
  PerformanceEntryKeyedBuffer() = default;

  void add(const PerformanceEntry& entry) override;

  void getEntries(std::vector<PerformanceEntry>& target) const override;

  void getEntries(std::string_view name, std::vector<PerformanceEntry>& target)
      const override;

  void clear() override;
  void clear(std::string_view name) override;

  std::optional<PerformanceEntry> find(const std::string& name) const;

 private:
  std::unordered_map<std::string, std::vector<PerformanceEntry>> entryMap_{};
  size_t totalEntryCount_ = 0;
};

} // namespace facebook::react
