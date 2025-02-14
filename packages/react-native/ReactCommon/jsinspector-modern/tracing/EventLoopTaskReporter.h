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
  std::chrono::steady_clock::time_point startTimestamp_;
};

} // namespace facebook::react::jsinspector_modern::tracing
