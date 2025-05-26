/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventLoopReporter.h"

#if defined(REACT_NATIVE_DEBUGGER_ENABLED)
#include <react/timing/primitives.h>
#include "PerformanceTracer.h"
#endif

namespace facebook::react::jsinspector_modern::tracing {

#if defined(REACT_NATIVE_DEBUGGER_ENABLED)

EventLoopReporter::EventLoopReporter(EventLoopPhase phase)
    : startTimestamp_(HighResTimeStamp::now()), phase_(phase) {}

EventLoopReporter::~EventLoopReporter() {
  PerformanceTracer& performanceTracer = PerformanceTracer::getInstance();
  if (performanceTracer.isTracing()) {
    auto end = HighResTimeStamp::now();
    switch (phase_) {
      case EventLoopPhase::Task:
        performanceTracer.reportEventLoopTask(startTimestamp_, end);
        break;

      case EventLoopPhase::Microtasks:
        performanceTracer.reportEventLoopMicrotasks(startTimestamp_, end);
        break;

      default:
        break;
    }
  }
}

#else

EventLoopReporter::EventLoopReporter(EventLoopPhase phase) {}

EventLoopReporter::~EventLoopReporter() {}

#endif

} // namespace facebook::react::jsinspector_modern::tracing
