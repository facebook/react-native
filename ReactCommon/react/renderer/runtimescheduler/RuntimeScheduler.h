/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <memory>
#include <queue>

namespace facebook::react {

class RuntimeScheduler final {
 public:
  RuntimeScheduler(RuntimeExecutor const &runtimeExecutor);

  void scheduleTask(std::shared_ptr<Task> const &task);

 private:
  mutable std::priority_queue<
      std::shared_ptr<Task>,
      std::vector<std::shared_ptr<Task>>,
      TaskPriorityComparer>
      taskQueue_;
  RuntimeExecutor const runtimeExecutor_;
};

} // namespace facebook::react
