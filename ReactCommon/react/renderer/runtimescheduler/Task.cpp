/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"

namespace facebook::react {

Task::Task(
    SchedulerPriority priority,
    jsi::Function callback,
    std::chrono::steady_clock::time_point expirationTime)
    : priority_(priority),
      callback_(std::move(callback)),
      expirationTime_(expirationTime) {}

SchedulerPriority Task::getPriority() const {
  return priority_;
}

RuntimeSchedulerClock::time_point Task::getExpirationTime() const {
  return expirationTime_;
}

void Task::cancel() {
  // Null out the callback to indicate the task has been canceled. (Can't
  // remove from the priority_queue because you can't remove arbitrary nodes
  // from an array based heap, only the first one.)
  callback_.reset();
}

void Task::operator()(jsi::Runtime &runtime) const {
  if (callback_) {
    // Cancelled task doesn't have a callback.
    callback_.value().call(runtime, {});
  }
}

} // namespace facebook::react
