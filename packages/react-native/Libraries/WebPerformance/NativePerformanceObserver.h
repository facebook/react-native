/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <functional>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {
class PerformanceEntryReporter;

#pragma mark - Structs

using RawPerformanceEntryType = int32_t;

using RawPerformanceEntry = NativePerformanceObserverCxxRawPerformanceEntry<
    std::string,
    RawPerformanceEntryType,
    double,
    double,
    // For "event" entries only:
    std::optional<double>,
    std::optional<double>,
    std::optional<uint32_t>>;

template <>
struct Bridging<RawPerformanceEntry>
    : NativePerformanceObserverCxxRawPerformanceEntryBridging<
          RawPerformanceEntry> {};

using GetPendingEntriesResult =
    NativePerformanceObserverCxxGetPendingEntriesResult<
        std::vector<RawPerformanceEntry>,
        uint32_t>;

template <>
struct Bridging<GetPendingEntriesResult>
    : NativePerformanceObserverCxxGetPendingEntriesResultBridging<
          GetPendingEntriesResult> {};

#pragma mark - implementation

class NativePerformanceObserver
    : public NativePerformanceObserverCxxSpec<NativePerformanceObserver>,
      std::enable_shared_from_this<NativePerformanceObserver> {
 public:
  NativePerformanceObserver(std::shared_ptr<CallInvoker> jsInvoker);
  ~NativePerformanceObserver();

  void startReporting(jsi::Runtime& rt, int32_t entryType);

  void stopReporting(jsi::Runtime& rt, int32_t entryType);

  void setIsBuffered(
      jsi::Runtime& rt,
      std::vector<int32_t> entryTypes,
      bool isBuffered);

  GetPendingEntriesResult popPendingEntries(jsi::Runtime& rt);

  void setOnPerformanceEntryCallback(
      jsi::Runtime& rt,
      std::optional<AsyncCallback<>> callback);

  void logRawEntry(jsi::Runtime& rt, RawPerformanceEntry entry);

  std::vector<std::pair<std::string, uint32_t>> getEventCounts(
      jsi::Runtime& rt);

  void setDurationThreshold(
      jsi::Runtime& rt,
      int32_t entryType,
      double durationThreshold);

  void clearEntries(
      jsi::Runtime& rt,
      int32_t entryType,
      std::optional<std::string> entryName);

  std::vector<RawPerformanceEntry> getEntries(
      jsi::Runtime& rt,
      std::optional<int32_t> entryType,
      std::optional<std::string> entryName);

  std::vector<RawPerformanceEntryType> getSupportedPerformanceEntryTypes(
      jsi::Runtime& rt);

 private:
};

} // namespace facebook::react
