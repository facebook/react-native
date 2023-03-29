/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformance.h"
#include <glog/logging.h>
#include "PerformanceEntryReporter.h"

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

} // namespace facebook::react
