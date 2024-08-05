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

#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

using NativePerformanceObserverCallback = AsyncCallback<std::vector<PerformanceEntry>&&, size_t>;

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

#pragma mark - implementation

class NativePerformanceObserver
    : public NativePerformanceObserverCxxSpec<NativePerformanceObserver> {
 public:
  NativePerformanceObserver(std::shared_ptr<CallInvoker> jsInvoker);
      
  jsi::Object createObserver(jsi::Runtime& rt, NativePerformanceObserverCallback callback);
  void observe(jsi::Runtime& rt, jsi::Object observer, jsi::Object options);
  void disconnect(jsi::Runtime& rt, jsi::Object observer);
  std::vector<PerformanceEntry> takeRecords(jsi::Runtime& rt, jsi::Object observerObj);

  std::vector<std::pair<std::string, uint32_t>> getEventCounts(
      jsi::Runtime& rt);

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
