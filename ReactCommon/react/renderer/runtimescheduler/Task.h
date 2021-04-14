/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>
#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/SchedulerPriority.h>

namespace facebook::react {

class Task final {
 public:
  Task(SchedulerPriority priority, jsi::Function callback);

  SchedulerPriority getPriority() const;
  void cancel();

  void operator()(jsi::Runtime &runtime) const;

 private:
  SchedulerPriority priority_;
  better::optional<jsi::Function> callback_;
};

class TaskPriorityComparer {
 public:
  inline bool operator()(
      std::shared_ptr<Task> const &lhs,
      std::shared_ptr<Task> const &rhs) {
    return lhs->getPriority() > rhs->getPriority();
  }
};

} // namespace facebook::react
