/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include("rncoreJSI.h") // Cmake headers on Android
#include "rncoreJSI.h"
#elif __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

#include <react/performance/timeline/PerformanceEntry.h>
#include <memory>
#include <optional>
#include <string>

namespace facebook::react {

using NativePerformancePerformanceObserverCallback = AsyncCallback<>;
using NativePerformancePerformanceObserverObserveOptions =
    NativePerformancePerformanceObserverInit<
        // entryTypes
        std::optional<std::vector<int>>,
        // type
        std::optional<int>,
        // buffered
        std::optional<bool>,
        // durationThreshold
        std::optional<double>>;

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
    : NativePerformanceRawPerformanceEntryBridging<PerformanceEntry> {};

template <>
struct Bridging<NativePerformancePerformanceObserverObserveOptions>
    : NativePerformancePerformanceObserverInitBridging<
          NativePerformancePerformanceObserverObserveOptions> {};

class NativePerformance : public NativePerformanceCxxSpec<NativePerformance> {
 public:
  NativePerformance(std::shared_ptr<CallInvoker> jsInvoker);

#pragma mark - DOM Performance (High Resolution Time) (https://www.w3.org/TR/hr-time-3/#dom-performance)

  // https://www.w3.org/TR/hr-time-3/#now-method
  double now(jsi::Runtime& rt);

#pragma mark - User Timing Level 3 functions (https://w3c.github.io/user-timing/)

  // https://w3c.github.io/user-timing/#mark-method
  // TODO delete when `markWithResult` is fully rolled out
  void mark(jsi::Runtime& rt, std::string name, double startTime);

  // https://w3c.github.io/user-timing/#measure-method
  // TODO delete when `measureWithResult` is fully rolled out
  void measure(
      jsi::Runtime& rt,
      std::string name,
      double startTime,
      double endTime,
      std::optional<double> duration,
      std::optional<std::string> startMark,
      std::optional<std::string> endMark);

  // https://w3c.github.io/user-timing/#mark-method
  double markWithResult(
      jsi::Runtime& rt,
      std::string name,
      std::optional<double> startTime);

  // https://w3c.github.io/user-timing/#measure-method
  std::tuple<double, double> measureWithResult(
      jsi::Runtime& rt,
      std::string name,
      double startTime,
      double endTime,
      std::optional<double> duration,
      std::optional<std::string> startMark,
      std::optional<std::string> endMark);

  // https://w3c.github.io/user-timing/#clearmarks-method
  void clearMarks(
      jsi::Runtime& rt,
      std::optional<std::string> entryName = std::nullopt);

  // https://w3c.github.io/user-timing/#clearmeasures-method
  void clearMeasures(
      jsi::Runtime& rt,
      std::optional<std::string> entryName = std::nullopt);

#pragma mark - Performance Timeline (https://w3c.github.io/performance-timeline/#performance-timeline)

  // https://www.w3.org/TR/performance-timeline/#getentries-method
  std::vector<PerformanceEntry> getEntries(jsi::Runtime& rt);

  // https://www.w3.org/TR/performance-timeline/#getentriesbytype-method
  std::vector<PerformanceEntry> getEntriesByType(
      jsi::Runtime& rt,
      PerformanceEntryType entryType);

  // https://www.w3.org/TR/performance-timeline/#getentriesbyname-method
  std::vector<PerformanceEntry> getEntriesByName(
      jsi::Runtime& rt,
      std::string entryName,
      std::optional<PerformanceEntryType> entryType = std::nullopt);

#pragma mark - Performance Observer (https://w3c.github.io/performance-timeline/#the-performanceobserver-interface)

  jsi::Object createObserver(
      jsi::Runtime& rt,
      NativePerformancePerformanceObserverCallback callback);

  // https://www.w3.org/TR/performance-timeline/#dom-performanceobservercallbackoptions-droppedentriescount
  double getDroppedEntriesCount(jsi::Runtime& rt, jsi::Object observerObj);

  void observe(
      jsi::Runtime& rt,
      jsi::Object observer,
      NativePerformancePerformanceObserverObserveOptions options);
  void disconnect(jsi::Runtime& rt, jsi::Object observer);
  std::vector<PerformanceEntry> takeRecords(
      jsi::Runtime& rt,
      jsi::Object observerObj,
      // When called via `observer.takeRecords` it should be in insertion order.
      // When called via the observer callback, it should be in chronological
      // order with respect to `startTime`.
      bool sort);

  std::vector<PerformanceEntryType> getSupportedPerformanceEntryTypes(
      jsi::Runtime& rt);

#pragma mark - Event Timing API functions (https://www.w3.org/TR/event-timing/)

  // https://www.w3.org/TR/event-timing/#dom-performance-eventcounts
  std::vector<std::pair<std::string, uint32_t>> getEventCounts(
      jsi::Runtime& rt);

#pragma mark - Non-standard memory functions

  // To align with web API, we will make sure to return three properties
  // (jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize) + anything needed from
  // the VM side.
  // `jsHeapSizeLimit`: The maximum size of the heap, in bytes, that
  // is available to the context.
  // `totalJSHeapSize`: The total allocated heap size, in bytes.
  // `usedJSHeapSize`: The currently active segment of JS heap, in
  // bytes.
  //
  // Note that we use int64_t here and it's ok to lose precision in JS doubles
  // for heap size information, as double's 2^53 sig bytes is large enough.
  std::unordered_map<std::string, double> getSimpleMemoryInfo(jsi::Runtime& rt);

#pragma mark - RN-specific startup timing

  // Collect and return the RN app startup timing information for performance
  // tracking.
  std::unordered_map<std::string, double> getReactNativeStartupTiming(
      jsi::Runtime& rt);
};

} // namespace facebook::react
