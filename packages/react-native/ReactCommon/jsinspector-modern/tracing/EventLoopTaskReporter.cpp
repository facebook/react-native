/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventLoopTaskReporter.h"

#if defined(REACT_NATIVE_DEBUGGER_ENABLED)
#include <react/timing/primitives.h>
#include "PerformanceTracer.h"
#endif

namespace facebook::react::jsinspector_modern::tracing {

#if defined(REACT_NATIVE_DEBUGGER_ENABLED)

EventLoopTaskReporter::EventLoopTaskReporter()
    : startTimestamp_(std::chrono::steady_clock::now()) {}

EventLoopTaskReporter::~EventLoopTaskReporter() {
  PerformanceTracer& performanceTracer = PerformanceTracer::getInstance();
  if (performanceTracer.isTracing()) {
    auto end = std::chrono::steady_clock::now();
    performanceTracer.reportEventLoopTask(
        chronoToTracingTimeStamp(startTimestamp_),
        chronoToTracingTimeStamp(end));
  }
}

#else

EventLoopTaskReporter::EventLoopTaskReporter() {}

EventLoopTaskReporter::~EventLoopTaskReporter() {}

#endif

} // namespace facebook::react::jsinspector_modern::tracing
