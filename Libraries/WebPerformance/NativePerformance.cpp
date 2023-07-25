/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <cxxreact/ReactMarker.h>
#include <jsi/instrumentation.h>
#include "NativePerformance.h"
#include "PerformanceEntryReporter.h"

#include "Plugins.h"

std::shared_ptr<facebook::react::TurboModule> NativePerformanceModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativePerformance>(
      std::move(jsInvoker));
}

namespace facebook::react {

NativePerformance::NativePerformance(std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceCxxSpec(std::move(jsInvoker)) {}

void NativePerformance::mark(
    jsi::Runtime &rt,
    std::string name,
    double startTime,
    double duration) {
  PerformanceEntryReporter::getInstance().mark(name, startTime, duration);
}

void NativePerformance::measure(
    jsi::Runtime &rt,
    std::string name,
    double startTime,
    double endTime,
    std::optional<double> duration,
    std::optional<std::string> startMark,
    std::optional<std::string> endMark) {
  PerformanceEntryReporter::getInstance().measure(
      name, startTime, endTime, duration, startMark, endMark);
}

std::unordered_map<std::string, double> NativePerformance::getSimpleMemoryInfo(
    jsi::Runtime &rt) {
  auto heapInfo = rt.instrumentation().getHeapInfo(false);
  std::unordered_map<std::string, double> heapInfoToJs;
  for (auto &entry : heapInfo) {
    heapInfoToJs[entry.first] = static_cast<double>(entry.second);
  }
  return heapInfoToJs;
}

ReactNativeStartupTiming NativePerformance::getReactNativeStartupTiming(
    jsi::Runtime &rt) {
  ReactNativeStartupTiming result = {0, 0, 0, 0};

  ReactMarker::StartupLogger &startupLogger =
      ReactMarker::StartupLogger::getInstance();
  result.startTime = startupLogger.getAppStartTime();
  result.executeJavaScriptBundleEntryPointStart =
      startupLogger.getRunJSBundleStartTime();
  result.executeJavaScriptBundleEntryPointEnd =
      startupLogger.getRunJSBundleEndTime();
  result.endTime = startupLogger.getRunJSBundleEndTime();

  return result;
}

} // namespace facebook::react
