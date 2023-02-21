/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

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

void NativePerformance::clearMarks(
    jsi::Runtime &rt,
    std::optional<std::string> markName) {
  PerformanceEntryReporter::getInstance().clearMarks(markName);
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

void NativePerformance::clearMeasures(
    jsi::Runtime &rt,
    std::optional<std::string> measureName) {
  PerformanceEntryReporter::getInstance().clearMeasures(measureName);
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

} // namespace facebook::react
