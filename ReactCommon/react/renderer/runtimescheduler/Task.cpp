/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"

namespace facebook::react {

Task::Task(SchedulerPriority priority, jsi::Function callback)
    : priority_(priority), callback_(std::move(callback)) {}

SchedulerPriority Task::getPriority() const {
  return priority_;
}

void Task::operator()(jsi::Runtime &runtime) const {
  callback_.call(runtime, {});
}

} // namespace facebook::react
