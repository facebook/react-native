/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "BoundedConsumableBuffer.h"
#include "ConsumableEntryMap.h"
#include "PerformanceEntry.h"

namespace facebook::react {

// Default duration threshold for reporting performance entries (0 means "report
// all")
constexpr double DEFAULT_DURATION_THRESHOLD = 0.0;

// Default buffer size limit, per entry type
constexpr size_t DEFAULT_MAX_BUFFER_SIZE = 1024;

/**
 * Abstract performance entry buffer with reporting flags.
 * Subtypes differ on how entries are stored.
 */
struct PerformanceEntryBuffer {
  double durationThreshold{DEFAULT_DURATION_THRESHOLD};
  size_t droppedEntriesCount{0};
  bool isAlwaysLogged{false};

  explicit PerformanceEntryBuffer() = default;
  virtual ~PerformanceEntryBuffer() = default;

  virtual void add(const PerformanceEntry& entry) = 0;
  virtual void consume(std::vector<PerformanceEntry>& target) = 0;
  virtual size_t pendingMessagesCount() const = 0;
  virtual void getEntries(
      std::optional<std::string_view> name,
      std::vector<PerformanceEntry>& target) const = 0;
  virtual void clear() = 0;
  virtual void clear(std::string_view name) = 0;
};

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

struct PerformanceEntryKeyedBuffer : public PerformanceEntryBuffer {
  ConsumableEntryMap entries;

  explicit PerformanceEntryKeyedBuffer() = default;
  ~PerformanceEntryKeyedBuffer() override = default;

  void add(const PerformanceEntry& entry) override;
  void consume(std::vector<PerformanceEntry>& target) override;

  size_t pendingMessagesCount() const override;

  void getEntries(
      std::optional<std::string_view> name,
      std::vector<PerformanceEntry>& target) const override;

  void clear() override;
  void clear(std::string_view name) override;
};

} // namespace facebook::react
