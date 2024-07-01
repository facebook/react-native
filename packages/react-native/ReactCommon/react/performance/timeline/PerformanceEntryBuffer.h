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

// Abstract performance entry buffer with reporting flags
struct PerformanceEntryBuffer {
  bool isReporting{false};
  bool isAlwaysLogged{false};
  double durationThreshold{DEFAULT_DURATION_THRESHOLD};

  explicit PerformanceEntryBuffer() = default;
  virtual ~PerformanceEntryBuffer() = default;

  virtual PerformanceEntryPushStatus add(const PerformanceEntry&& entry) = 0;
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

  PerformanceEntryPushStatus add(const PerformanceEntry&& entry) override {
    return entries.add(std::move(entry));
  }

  void consume(std::vector<PerformanceEntry>& target) override {
    entries.consume(target);
  }

  size_t pendingMessagesCount() const override {
    return entries.getNumToConsume();
  }

  void getEntries(
      std::optional<std::string_view> name,
      std::vector<PerformanceEntry>& target) const override {
    entries.getEntries(
        target, [&](const PerformanceEntry& e) { return e.name == name; });
  }

  void clear() override {
    entries.clear();
  }

  void clear(std::string_view name) override {
    entries.clear([&](const PerformanceEntry& e) { return e.name == name; });
  }
};

struct PerformanceEntryKeyedBuffer : public PerformanceEntryBuffer {
  ConsumableEntryMap entries;

  explicit PerformanceEntryKeyedBuffer() = default;
  ~PerformanceEntryKeyedBuffer() override = default;

  PerformanceEntryPushStatus add(const PerformanceEntry&& entry) override {
    entries.add(entry);
    return PerformanceEntryPushStatus::OK;
  }

  void consume(std::vector<PerformanceEntry>& target) override {
    entries.consume(target);
  }

  size_t pendingMessagesCount() const override {
    return entries.getNumToConsume();
  }

  void getEntries(
      std::optional<std::string_view> name,
      std::vector<PerformanceEntry>& target) const override {
    if (name.has_value()) {
      std::string nameStr{name.value()};
      entries.getEntries(nameStr, target);
    } else {
      entries.getEntries(target);
    }
  }

  void clear() override {
    entries.clear();
  }

  void clear(std::string_view name) override {
    std::string nameStr{name};
    entries.clear(nameStr);
  }
};

} // namespace facebook::react
