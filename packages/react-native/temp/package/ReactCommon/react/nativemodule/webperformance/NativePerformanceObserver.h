/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

#pragma mark - Structs

template <>
struct Bridging<PerformanceEntryType> {
  static PerformanceEntryType fromJs(
      jsi::Runtime& /*rt*/,
      const jsi::Value& value) {
    return static_cast<PerformanceEntryType>(value.asNumber());
  }

  static jsi::Value toJs(
      jsi::Runtime& /*rt*/,
      const PerformanceEntryType& value) {
    return {static_cast<int>(value)};
  }
};

template <>
struct Bridging<PerformanceEntry>
    : NativePerformanceObserverRawPerformanceEntryBridging<PerformanceEntry> {};

template <>
struct Bridging<PerformanceEntryReporter::PopPendingEntriesResult>
    : NativePerformanceObserverGetPendingEntriesResultBridging<
          PerformanceEntryReporter::PopPendingEntriesResult> {};

#pragma mark - implementation

class NativePerformanceObserver
    : public NativePerformanceObserverCxxSpec<NativePerformanceObserver> {
 public:
  NativePerformanceObserver(std::shared_ptr<CallInvoker> jsInvoker);

  void startReporting(jsi::Runtime& rt, PerformanceEntryType entryType);

  void stopReporting(jsi::Runtime& rt, PerformanceEntryType entryType);

  void setIsBuffered(
      jsi::Runtime& rt,
      const std::vector<PerformanceEntryType> entryTypes,
      bool isBuffered);

  PerformanceEntryReporter::PopPendingEntriesResult popPendingEntries(
      jsi::Runtime& rt);

  void setOnPerformanceEntryCallback(
      jsi::Runtime& rt,
      std::optional<AsyncCallback<>> callback);

  void logRawEntry(jsi::Runtime& rt, const PerformanceEntry entry);

  std::vector<std::pair<std::string, uint32_t>> getEventCounts(
      jsi::Runtime& rt);

  void setDurationThreshold(
      jsi::Runtime& rt,
      PerformanceEntryType entryType,
      DOMHighResTimeStamp durationThreshold);

  void clearEntries(
      jsi::Runtime& rt,
      PerformanceEntryType entryType,
      std::optional<std::string> entryName);

  std::vector<PerformanceEntry> getEntries(
      jsi::Runtime& rt,
      std::optional<PerformanceEntryType> entryType,
      std::optional<std::string> entryName);

  std::vector<PerformanceEntryType> getSupportedPerformanceEntryTypes(
      jsi::Runtime& rt);
};

} // namespace facebook::react
