/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceEntryBuffer.h"
#include "BoundedConsumableBuffer.h"

namespace facebook::react {

class PerformanceEntryCircularBuffer : public PerformanceEntryBuffer {
public:
  explicit PerformanceEntryCircularBuffer(size_t size) : entries_(size) {}
  ~PerformanceEntryCircularBuffer() override = default;

  void add(const PerformanceEntry& entry) override;
  void consume(std::vector<PerformanceEntry>& target) override;

  void getEntries(
      std::optional<std::string_view> name,
      std::vector<PerformanceEntry>& target) const override;

  void clear() override;
  void clear(std::string_view name) override;
  
private:
  BoundedConsumableBuffer<PerformanceEntry> entries_;
};

} // namespace facebook::react
