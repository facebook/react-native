/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceEntry.h"

namespace facebook::react {

// Default duration threshold for reporting performance entries (0 means "report
// all")
constexpr double DEFAULT_DURATION_THRESHOLD = 0.0;

/**
 * Abstract performance entry buffer with reporting flags.
 * Subtypes differ on how entries are stored.
 */
class PerformanceEntryBuffer {
public:
  double durationThreshold{DEFAULT_DURATION_THRESHOLD};
  size_t droppedEntriesCount{0};
  bool isAlwaysLogged{false};

  explicit PerformanceEntryBuffer() = default;
  virtual ~PerformanceEntryBuffer() = default;

  virtual void add(const PerformanceEntry& entry) = 0;
  virtual void consume(std::vector<PerformanceEntry>& target) = 0;
  [[nodiscard]] virtual size_t pendingMessagesCount() const = 0;
  virtual void getEntries(
      std::optional<std::string_view> name,
      std::vector<PerformanceEntry>& target) const = 0;
  virtual void clear() = 0;
  virtual void clear(std::string_view name) = 0;


  // https://www.w3.org/TR/event-timing/#sec-should-add-performanceeventtiming
  // TODO: perhaps move it to a better place
  [[nodiscard]] bool shouldAdd(const PerformanceEntry& entry) const {
    if (entry.entryType == PerformanceEntryType::EVENT) {
      if (entry.duration < durationThreshold) {
        // The entries duration is lower than the desired reporting threshold, skip
        return false;
      }
    }

    return true;
  }
};

} // namespace facebook::react
