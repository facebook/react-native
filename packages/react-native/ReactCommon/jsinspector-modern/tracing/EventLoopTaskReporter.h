/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>

namespace facebook::react::jsinspector_modern::tracing {

struct EventLoopTaskReporter {
 public:
  EventLoopTaskReporter();

  EventLoopTaskReporter(const EventLoopTaskReporter&) = delete;
  EventLoopTaskReporter(EventLoopTaskReporter&&) = delete;
  EventLoopTaskReporter& operator=(const EventLoopTaskReporter&) = delete;
  EventLoopTaskReporter& operator=(EventLoopTaskReporter&&) = delete;

  ~EventLoopTaskReporter();

 private:
#if defined(REACT_NATIVE_DEBUGGER_ENABLED)
  std::chrono::steady_clock::time_point startTimestamp_;
#endif
};

} // namespace facebook::react::jsinspector_modern::tracing
