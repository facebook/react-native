/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <atomic>
#include <memory>
#include <queue>

namespace facebook::react {

class RuntimeScheduler final {
 public:
  RuntimeScheduler(RuntimeExecutor const &runtimeExecutor);

  void scheduleTask(std::shared_ptr<Task> const &task);

  void cancelTask(std::shared_ptr<Task> const &task);

  bool getShouldYield() const;

 private:
  mutable std::priority_queue<
      std::shared_ptr<Task>,
      std::vector<std::shared_ptr<Task>>,
      TaskPriorityComparer>
      taskQueue_;
  RuntimeExecutor const runtimeExecutor_;
  std::atomic_bool shouldYield_{false};
};

} // namespace facebook::react
