/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"

namespace facebook::react {

RuntimeScheduler::RuntimeScheduler(RuntimeExecutor const &runtimeExecutor)
    : RuntimeScheduler(runtimeExecutor, RuntimeSchedulerClock::now) {}

RuntimeScheduler::RuntimeScheduler(
    RuntimeExecutor const &runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now)
    : runtimeExecutor_(runtimeExecutor), now_(now) {}

std::shared_ptr<Task> RuntimeScheduler::scheduleTask(
    SchedulerPriority priority,
    jsi::Function callback) {
  auto expirationTime = now() + timeoutForSchedulerPriority(priority);
  auto task =
      std::make_shared<Task>(priority, std::move(callback), expirationTime);
  taskQueue_.push(task);

  if (!isCallbackScheduled_) {
    isCallbackScheduled_ = true;
    runtimeExecutor_([this](jsi::Runtime &runtime) {
      isCallbackScheduled_ = false;

      while (!taskQueue_.empty()) {
        auto topPriority = taskQueue_.top();
        taskQueue_.pop();
        (*topPriority)(runtime);
      }
    });
  }

  return task;
}

void RuntimeScheduler::cancelTask(const std::shared_ptr<Task> &task) {
  task->cancel();
}

bool RuntimeScheduler::getShouldYield() const {
  return shouldYield_;
}

RuntimeSchedulerTimePoint RuntimeScheduler::now() const {
  return now_();
}

} // namespace facebook::react
