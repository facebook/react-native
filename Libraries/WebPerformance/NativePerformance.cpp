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

} // namespace facebook::react
