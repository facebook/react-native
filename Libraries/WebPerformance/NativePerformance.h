/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <memory>
#include <string>

#include "NativePerformanceObserver.h"

namespace facebook::react {
class PerformanceEntryReporter;

#pragma mark - Structs

using ReactNativeStartupTiming =
    NativePerformanceCxxBaseReactNativeStartupTiming<
        int32_t, // Start time of the RN app startup process
        int32_t, // End time of the RN app startup process
        int32_t, // Start time that RN app execute the JS bundle
        int32_t // End time that RN app execute the JS bundle
        >;

template <>
struct Bridging<ReactNativeStartupTiming>
    : NativePerformanceCxxBaseReactNativeStartupTimingBridging<
          int32_t,
          int32_t,
          int32_t,
          int32_t> {};

#pragma mark - implementation

class NativePerformance : public NativePerformanceCxxSpec<NativePerformance>,
                          std::enable_shared_from_this<NativePerformance> {
 public:
  NativePerformance(std::shared_ptr<CallInvoker> jsInvoker);

  void
  mark(jsi::Runtime &rt, std::string name, double startTime, double duration);

  void measure(
      jsi::Runtime &rt,
      std::string name,
      double startTime,
      double endTime,
      std::optional<double> duration,
      std::optional<std::string> startMark,
      std::optional<std::string> endMark);

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
  std::unordered_map<std::string, double> getSimpleMemoryInfo(jsi::Runtime &rt);

  // Collect and return the RN app startup timing information for performance
  // tracking.
  ReactNativeStartupTiming getReactNativeStartupTiming(jsi::Runtime &rt);

 private:
};

} // namespace facebook::react
