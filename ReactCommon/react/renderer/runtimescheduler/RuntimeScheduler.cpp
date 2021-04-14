/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"

namespace facebook::react {

RuntimeScheduler::RuntimeScheduler(RuntimeExecutor const &runtimeExecutor)
    : runtimeExecutor_(runtimeExecutor) {}

void RuntimeScheduler::scheduleTask(std::shared_ptr<Task> const &task) {
  taskQueue_.push(task);

  runtimeExecutor_([this](jsi::Runtime &runtime) {
    auto topPriority = taskQueue_.top();
    taskQueue_.pop();
    (*topPriority)(runtime);
  });
}

void RuntimeScheduler::cancelTask(const std::shared_ptr<Task> &task) {
  task->cancel();
}

} // namespace facebook::react
