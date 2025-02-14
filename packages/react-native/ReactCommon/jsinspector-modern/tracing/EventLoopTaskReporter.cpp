/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventLoopTaskReporter.h"

#if defined(REACT_NATIVE_FORCE_ENABLE_FUSEBOX) || \
    defined(HERMES_ENABLE_DEBUGGER) ||            \
    defined(REACT_NATIVE_ENABLE_FUSEBOX_RELEASE)
#include "PerformanceTracer.h"

#endif

namespace facebook::react::jsinspector_modern::tracing {

#if defined(REACT_NATIVE_FORCE_ENABLE_FUSEBOX) || \
    defined(HERMES_ENABLE_DEBUGGER) ||            \
    defined(REACT_NATIVE_ENABLE_FUSEBOX_RELEASE)
namespace {

inline uint64_t formatTimePointToUnixTimestamp(
    std::chrono::steady_clock::time_point timestamp) {
  return std::chrono::duration_cast<std::chrono::microseconds>(
             timestamp.time_since_epoch())
      .count();
}

} // namespace
#endif

#if defined(REACT_NATIVE_FORCE_ENABLE_FUSEBOX) || \
    defined(HERMES_ENABLE_DEBUGGER) ||            \
    defined(REACT_NATIVE_ENABLE_FUSEBOX_RELEASE)

EventLoopTaskReporter::EventLoopTaskReporter()
    : startTimestamp_(std::chrono::steady_clock::now()) {}

EventLoopTaskReporter::~EventLoopTaskReporter() {
  auto end = std::chrono::steady_clock::now();
  PerformanceTracer::getInstance().reportEventLoopTask(
      formatTimePointToUnixTimestamp(startTimestamp_),
      formatTimePointToUnixTimestamp(end));
}

#else

EventLoopTaskReporter::EventLoopTaskReporter() {}

EventLoopTaskReporter::~EventLoopTaskReporter() {}

#endif

} // namespace facebook::react::jsinspector_modern::tracing
