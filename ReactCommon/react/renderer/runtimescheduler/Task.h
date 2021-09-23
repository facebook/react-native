/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>
#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerClock.h>
#include <react/renderer/runtimescheduler/SchedulerPriority.h>

namespace facebook::react {

class RuntimeScheduler;
class TaskPriorityComparer;

struct Task final {
  Task(
      SchedulerPriority priority,
      jsi::Function callback,
      std::chrono::steady_clock::time_point expirationTime);

 private:
  friend RuntimeScheduler;
  friend TaskPriorityComparer;

  SchedulerPriority priority;
  better::optional<jsi::Function> callback;
  RuntimeSchedulerClock::time_point expirationTime;

  jsi::Value execute(jsi::Runtime &runtime);
};

class TaskPriorityComparer {
 public:
  inline bool operator()(
      std::shared_ptr<Task> const &lhs,
      std::shared_ptr<Task> const &rhs) {
    return lhs->expirationTime > rhs->expirationTime;
  }
};

} // namespace facebook::react
