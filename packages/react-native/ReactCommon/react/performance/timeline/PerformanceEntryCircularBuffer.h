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

struct PerformanceEntryCircularBuffer : public PerformanceEntryBuffer {
  BoundedConsumableBuffer<PerformanceEntry> entries;

  explicit PerformanceEntryCircularBuffer(size_t size) : entries(size) {}
  ~PerformanceEntryCircularBuffer() override = default;

  void add(const PerformanceEntry& entry) override;
  void consume(std::vector<PerformanceEntry>& target) override;

  [[nodiscard]] size_t pendingMessagesCount() const override;

  void getEntries(
      std::optional<std::string_view> name,
      std::vector<PerformanceEntry>& target) const override;

  void clear() override;
  void clear(std::string_view name) override;
};

} // namespace facebook::react
