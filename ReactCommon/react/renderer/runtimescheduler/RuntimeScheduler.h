/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerClock.h>
#include <react/renderer/runtimescheduler/Task.h>
#include <atomic>
#include <memory>
#include <queue>

namespace facebook {
namespace react {

class RuntimeScheduler final {
 public:
  RuntimeScheduler(
      RuntimeExecutor runtimeExecutor,
      std::function<RuntimeSchedulerTimePoint()> now =
          RuntimeSchedulerClock::now);
  /*
   * Not copyable.
   */
  RuntimeScheduler(RuntimeScheduler const &) = delete;
  RuntimeScheduler &operator=(RuntimeScheduler const &) = delete;

  /*
   * Not movable.
   */
  RuntimeScheduler(RuntimeScheduler &&) = delete;
  RuntimeScheduler &operator=(RuntimeScheduler &&) = delete;

  void scheduleWork(std::function<void(jsi::Runtime &)> callback) const;

  /*
   * Grants access to the runtime synchronously on the caller's thread.
   *
   * Shouldn't be called directly. it is expected to be used
   * by dispatching a synchronous event via event emitter in your native
   * component.
   */
  void executeNowOnTheSameThread(
      std::function<void(jsi::Runtime &runtime)> callback);

  /*
   * Adds a JavaScript callback to priority queue with given priority.
   * Triggers workloop if needed.
   *
   * Thread synchronization must be enforced externally.
   */
  std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      jsi::Function callback);

  /*
   * Cancelled task will never be executed.
   *
   * Operates on JSI object.
   * Thread synchronization must be enforced externally.
   */
  void cancelTask(Task &task) noexcept;

  /*
   * Return value indicates if host platform has a pending access to the
   * runtime.
   *
   * Can be called from any thread.
   */
  bool getShouldYield() const noexcept;

  /*
   * Return value informs if the current task is executed inside synchronous
   * block.
   *
   * Can be called from any thread.
   */
  bool getIsSynchronous() const noexcept;

  /*
   * Returns value of currently executed task. Designed to be called from React.
   *
   * Thread synchronization must be enforced externally.
   */
  SchedulerPriority getCurrentPriorityLevel() const noexcept;

  /*
   * Returns current monotonic time. This time is not related to wall clock
   * time.
   *
   * Thread synchronization must be enforced externally.
   */
  RuntimeSchedulerTimePoint now() const noexcept;

 private:
  mutable std::priority_queue<
      std::shared_ptr<Task>,
      std::vector<std::shared_ptr<Task>>,
      TaskPriorityComparer>
      taskQueue_;

  RuntimeExecutor const runtimeExecutor_;
  mutable SchedulerPriority currentPriority_{SchedulerPriority::NormalPriority};
  mutable std::atomic_bool shouldYield_{false};
  mutable std::atomic_bool isSynchronous_{false};

  void startWorkLoop(jsi::Runtime &runtime) const;

  /*
   * Schedules a work loop unless it has been already scheduled
   * This is to avoid unnecessary calls to `runtimeExecutor`.
   */
  void scheduleWorkLoopIfNecessary() const;

  /*
   * Returns a time point representing the current point in time. May be called
   * from multiple threads.
   */
  std::function<RuntimeSchedulerTimePoint()> now_;

  /*
   * Flag indicating if callback on JavaScript queue has been
   * scheduled.
   */
  mutable std::atomic_bool isWorkLoopScheduled_{false};

  /*
   * This flag is set while performing work, to prevent re-entrancy.
   */
  mutable std::atomic_bool isPerformingWork_{false};
};

} // namespace react
} // namespace facebook
