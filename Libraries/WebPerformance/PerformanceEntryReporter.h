/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Function.h>
#include <array>
#include <optional>
#include "NativePerformanceObserver.h"

namespace facebook::react {

enum class PerformanceEntryType {
  UNDEFINED = 0,
  MARK = 1,
  _COUNT = 2,
};

class PerformanceEntryReporter {
 public:
  void setReportingCallback(std::optional<AsyncCallback<>> callback);
  void startReporting(PerformanceEntryType entryType);
  void stopReporting(PerformanceEntryType entryType);

  const std::vector<RawPerformanceEntry> &getPendingEntries() const;
  std::vector<RawPerformanceEntry> popPendingEntries();
  void clearPendingEntries();
  void logEntry(const RawPerformanceEntry &entry);

  bool isReportingType(PerformanceEntryType entryType) const {
    return reportingType_[static_cast<int>(entryType)];
  }

 private:
  std::optional<AsyncCallback<>> callback_;
  std::vector<RawPerformanceEntry> entries_;
  std::array<bool, (size_t)PerformanceEntryType::_COUNT> reportingType_{false};
};

} // namespace facebook::react
