/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/SchedulerPriority.h>
#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerClock.h>

#include <optional>
#include <variant>

namespace facebook::react {

class RuntimeScheduler_Legacy;
class RuntimeScheduler_Modern;
class TaskPriorityComparer;

using RawCallback = std::function<void(jsi::Runtime&)>;

struct Task final : public jsi::NativeState {
  Task(
      SchedulerPriority priority,
      jsi::Function&& callback,
      std::chrono::steady_clock::time_point expirationTime);

  Task(
      SchedulerPriority priority,
      RawCallback&& callback,
      std::chrono::steady_clock::time_point expirationTime);

 private:
  friend RuntimeScheduler_Legacy;
  friend RuntimeScheduler_Modern;
  friend TaskPriorityComparer;

  SchedulerPriority priority;
  std::optional<std::variant<jsi::Function, RawCallback>> callback;
  RuntimeSchedulerClock::time_point expirationTime;

  jsi::Value execute(jsi::Runtime& runtime, bool didUserCallbackTimeout);
};

class TaskPriorityComparer {
 public:
  inline bool operator()(
      const std::shared_ptr<Task>& lhs,
      const std::shared_ptr<Task>& rhs) {
    return lhs->expirationTime > rhs->expirationTime;
  }
};

} // namespace facebook::react
