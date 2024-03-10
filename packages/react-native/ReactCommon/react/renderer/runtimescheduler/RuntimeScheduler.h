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

namespace facebook::react {

using RuntimeSchedulerRenderingUpdate = std::function<void()>;

// This is a temporary abstract class for RuntimeScheduler forks to implement
// (and use them interchangeably).
class RuntimeSchedulerBase {
 public:
  virtual ~RuntimeSchedulerBase() = default;
  virtual void scheduleWork(RawCallback&& callback) noexcept = 0;
  virtual void executeNowOnTheSameThread(RawCallback&& callback) = 0;
  virtual std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      jsi::Function&& callback) noexcept = 0;
  virtual std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      RawCallback&& callback) noexcept = 0;
  virtual void cancelTask(Task& task) noexcept = 0;
  virtual bool getShouldYield() const noexcept = 0;
  virtual bool getIsSynchronous() const noexcept = 0;
  virtual SchedulerPriority getCurrentPriorityLevel() const noexcept = 0;
  virtual RuntimeSchedulerTimePoint now() const noexcept = 0;
  virtual void callExpiredTasks(jsi::Runtime& runtime) = 0;
  virtual void scheduleRenderingUpdate(
      RuntimeSchedulerRenderingUpdate&& renderingUpdate) = 0;
};

// This is a proxy for RuntimeScheduler implementation, which will be selected
// at runtime based on a feature flag.
class RuntimeScheduler final : RuntimeSchedulerBase {
 public:
  explicit RuntimeScheduler(
      RuntimeExecutor runtimeExecutor,
      std::function<RuntimeSchedulerTimePoint()> now =
          RuntimeSchedulerClock::now);

  /*
   * Not copyable.
   */
  RuntimeScheduler(const RuntimeScheduler&) = delete;
  RuntimeScheduler& operator=(const RuntimeScheduler&) = delete;

  /*
   * Not movable.
   */
  RuntimeScheduler(RuntimeScheduler&&) = delete;
  RuntimeScheduler& operator=(RuntimeScheduler&&) = delete;

  void scheduleWork(RawCallback&& callback) noexcept override;

  /*
   * Grants access to the runtime synchronously on the caller's thread.
   *
   * Shouldn't be called directly. it is expected to be used
   * by dispatching a synchronous event via event emitter in your native
   * component.
   */
  void executeNowOnTheSameThread(RawCallback&& callback) override;

  /*
   * Adds a JavaScript callback to priority queue with given priority.
   * Triggers workloop if needed.
   *
   * Thread synchronization must be enforced externally.
   */
  std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      jsi::Function&& callback) noexcept override;

  std::shared_ptr<Task> scheduleTask(
      SchedulerPriority priority,
      RawCallback&& callback) noexcept override;

  /*
   * Cancelled task will never be executed.
   *
   * Operates on JSI object.
   * Thread synchronization must be enforced externally.
   */
  void cancelTask(Task& task) noexcept override;

  /*
   * Return value indicates if host platform has a pending access to the
   * runtime.
   *
   * Can be called from any thread.
   */
  bool getShouldYield() const noexcept override;

  /*
   * Return value informs if the current task is executed inside synchronous
   * block.
   *
   * Can be called from any thread.
   */
  bool getIsSynchronous() const noexcept override;

  /*
   * Returns value of currently executed task. Designed to be called from React.
   *
   * Thread synchronization must be enforced externally.
   */
  SchedulerPriority getCurrentPriorityLevel() const noexcept override;

  /*
   * Returns current monotonic time. This time is not related to wall clock
   * time.
   *
   * Thread synchronization must be enforced externally.
   */
  RuntimeSchedulerTimePoint now() const noexcept override;

  /*
   * Expired task is a task that should have been already executed. Designed to
   * be called in the event pipeline after an event is dispatched to React.
   * React may schedule events with immediate priority which need to be handled
   * before the next event is sent to React.
   *
   * Thread synchronization must be enforced externally.
   */
  void callExpiredTasks(jsi::Runtime& runtime) override;

  void scheduleRenderingUpdate(
      RuntimeSchedulerRenderingUpdate&& renderingUpdate) override;

 private:
  // Actual implementation, stored as a unique pointer to simplify memory
  // management.
  std::unique_ptr<RuntimeSchedulerBase> runtimeSchedulerImpl_;
};

} // namespace facebook::react
