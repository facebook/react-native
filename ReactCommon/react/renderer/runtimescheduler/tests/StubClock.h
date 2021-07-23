/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/runtimescheduler/RuntimeSchedulerClock.h>
#include <chrono>

namespace facebook::react {

class StubClock {
 public:
  RuntimeSchedulerTimePoint getNow() const {
    return timePoint_;
  }

  void setTimePoint(RuntimeSchedulerTimePoint timePoint) {
    timePoint_ = timePoint;
  }

  void setTimePoint(RuntimeSchedulerDuration duration) {
    timePoint_ = RuntimeSchedulerTimePoint(duration);
  }

  RuntimeSchedulerTimePoint getTimePoint() {
    return timePoint_;
  }

  void advanceTimeBy(RuntimeSchedulerDuration duration) {
    timePoint_ += duration;
  }

 private:
  RuntimeSchedulerTimePoint timePoint_;
};

} // namespace facebook::react
