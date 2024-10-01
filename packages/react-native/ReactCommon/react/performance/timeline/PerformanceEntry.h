/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>
#include <optional>
#include <string>
#include <unordered_set>

namespace facebook::react {

using PerformanceEntryInteractionId = uint32_t;

enum class PerformanceEntryType {
  // We need to preserve these values for backwards compatibility.
  MARK = 1,
  MEASURE = 2,
  EVENT = 3,
  LONGTASK = 4,
  _NEXT = 5,
};

struct PerformanceEntry {
  std::string name;
  PerformanceEntryType entryType;
  DOMHighResTimeStamp startTime;
  DOMHighResTimeStamp duration = 0;

  // For "event" entries only:
  std::optional<DOMHighResTimeStamp> processingStart;
  std::optional<DOMHighResTimeStamp> processingEnd;
  std::optional<PerformanceEntryInteractionId> interactionId;
};

constexpr size_t NUM_PERFORMANCE_ENTRY_TYPES =
    (size_t)PerformanceEntryType::_NEXT - 1; // Valid types start from 1.

struct PerformanceEntrySorter {
  bool operator()(const PerformanceEntry& lhs, const PerformanceEntry& rhs) {
    if (lhs.startTime != rhs.startTime) {
      return lhs.startTime < rhs.startTime;
    } else {
      return lhs.duration < rhs.duration;
    }
  }
};

} // namespace facebook::react
