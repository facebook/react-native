/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler_Modern.h"
#include "SchedulerPriorityUtils.h"

#include <react/renderer/debug/SystraceSection.h>
#include <utility>
#include "ErrorUtils.h"

namespace facebook::react {

#pragma mark - Public

RuntimeScheduler_Modern::RuntimeScheduler_Modern(
    RuntimeExecutor runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now)
    : runtimeExecutor_(std::move(runtimeExecutor)), now_(std::move(now)) {}

void RuntimeScheduler_Modern::scheduleWork(RawCallback&& callback) noexcept {
  SystraceSection s("RuntimeScheduler::scheduleWork");
  scheduleTask(SchedulerPriority::ImmediatePriority, std::move(callback));
}

std::shared_ptr<Task> RuntimeScheduler_Modern::scheduleTask(
    SchedulerPriority priority,
    jsi::Function&& callback) noexcept {
  SystraceSection s(
      "RuntimeScheduler::scheduleTask",
      "priority",
      serialize(priority),
      "callbackType",
      "jsi::Function");

  auto expirationTime = now_() + timeoutForSchedulerPriority(priority);
  auto task =
      std::make_shared<Task>(priority, std::move(callback), expirationTime);

  scheduleTask(task);

  return task;
}

std::shared_ptr<Task> RuntimeScheduler_Modern::scheduleTask(
    SchedulerPriority priority,
    RawCallback&& callback) noexcept {
  SystraceSection s(
      "RuntimeScheduler::scheduleTask",
      "priority",
      serialize(priority),
      "callbackType",
      "RawCallback");

  auto expirationTime = now_() + timeoutForSchedulerPriority(priority);
  auto task =
      std::make_shared<Task>(priority, std::move(callback), expirationTime);

  scheduleTask(task);

  return task;
}

bool RuntimeScheduler_Modern::getShouldYield() const noexcept {
  std::shared_lock lock(schedulingMutex_);

  return syncTaskRequests_ > 0 ||
      (!taskQueue_.empty() && taskQueue_.top() != currentTask_);
}

bool RuntimeScheduler_Modern::getIsSynchronous() const noexcept {
  return isSynchronous_;
}

void RuntimeScheduler_Modern::cancelTask(Task& task) noexcept {
  task.callback.reset();
}

SchedulerPriority RuntimeScheduler_Modern::getCurrentPriorityLevel()
    const noexcept {
  return currentPriority_;
}

RuntimeSchedulerTimePoint RuntimeScheduler_Modern::now() const noexcept {
  return now_();
}

void RuntimeScheduler_Modern::executeNowOnTheSameThread(
    RawCallback&& callback) {
  SystraceSection s("RuntimeScheduler::executeNowOnTheSameThread");

  syncTaskRequests_++;

  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor_,
      [this, callback = std::move(callback)](jsi::Runtime& runtime) mutable {
        SystraceSection s2(
            "RuntimeScheduler::executeNowOnTheSameThread callback");

        syncTaskRequests_--;

        isSynchronous_ = true;

        auto currentTime = now_();
        auto priority = SchedulerPriority::ImmediatePriority;
        auto expirationTime =
            currentTime + timeoutForSchedulerPriority(priority);
        auto task = std::make_shared<Task>(
            priority, std::move(callback), expirationTime);

        executeTask(runtime, task, currentTime);

        isSynchronous_ = false;
      });

  bool shouldScheduleWorkLoop = false;

  {
    // Unique access because we might write to `isWorkLoopScheduled_`.
    std::unique_lock lock(schedulingMutex_);

    // We only need to schedule the work loop if there any remaining tasks
    // in the queue.
    if (!taskQueue_.empty() && !isWorkLoopScheduled_) {
      isWorkLoopScheduled_ = true;
      shouldScheduleWorkLoop = true;
    }
  }

  if (shouldScheduleWorkLoop) {
    scheduleWorkLoop();
  }
}

// This will be replaced by microtasks
void RuntimeScheduler_Modern::callExpiredTasks(jsi::Runtime& runtime) {
  SystraceSection s("RuntimeScheduler::callExpiredTasks");
  startWorkLoop(runtime, true);
}

#pragma mark - Private

void RuntimeScheduler_Modern::scheduleTask(std::shared_ptr<Task> task) {
  bool shouldScheduleWorkLoop = false;

  {
    std::unique_lock lock(schedulingMutex_);

    // We only need to schedule the work loop if the task we're about to
    // schedule is the only one in the queue.
    // Otherwise, we don't need to schedule it because there's another one
    // running already that will pick up the new task.
    if (taskQueue_.empty() && !isWorkLoopScheduled_) {
      isWorkLoopScheduled_ = true;
      shouldScheduleWorkLoop = true;
    }

    taskQueue_.push(task);
  }

  if (shouldScheduleWorkLoop) {
    scheduleWorkLoop();
  }
}

void RuntimeScheduler_Modern::scheduleWorkLoop() {
  runtimeExecutor_(
      [this](jsi::Runtime& runtime) { startWorkLoop(runtime, false); });
}

void RuntimeScheduler_Modern::startWorkLoop(
    jsi::Runtime& runtime,
    bool onlyExpired) {
  SystraceSection s("RuntimeScheduler::startWorkLoop");

  auto previousPriority = currentPriority_;

  try {
    while (syncTaskRequests_ == 0) {
      auto currentTime = now_();
      auto topPriorityTask = selectTask(currentTime, onlyExpired);

      if (!topPriorityTask) {
        // No pending work to do.
        // Events will restart the loop when necessary.
        break;
      }

      executeTask(runtime, topPriorityTask, currentTime);
    }
  } catch (jsi::JSError& error) {
    handleFatalError(runtime, error);
  }

  currentPriority_ = previousPriority;
}

std::shared_ptr<Task> RuntimeScheduler_Modern::selectTask(
    RuntimeSchedulerTimePoint currentTime,
    bool onlyExpired) {
  // We need a unique lock here because we'll also remove executed tasks from
  // the top of the queue.
  std::unique_lock lock(schedulingMutex_);

  // It's safe to reset the flag here, as its access is also synchronized with
  // the access to the task queue.
  isWorkLoopScheduled_ = false;

  // Skip executed tasks
  while (!taskQueue_.empty() && !taskQueue_.top()->callback) {
    taskQueue_.pop();
  }

  if (!taskQueue_.empty()) {
    auto task = taskQueue_.top();
    auto didUserCallbackTimeout = task->expirationTime <= currentTime;
    if (!onlyExpired || didUserCallbackTimeout) {
      return task;
    }
  }

  return nullptr;
}

void RuntimeScheduler_Modern::executeTask(
    jsi::Runtime& runtime,
    const std::shared_ptr<Task>& task,
    RuntimeSchedulerTimePoint currentTime) {
  auto didUserCallbackTimeout = task->expirationTime <= currentTime;

  SystraceSection s(
      "RuntimeScheduler::executeTask",
      "priority",
      serialize(task->priority),
      "didUserCallbackTimeout",
      didUserCallbackTimeout);

  currentTask_ = task;
  currentPriority_ = task->priority;

  auto result = task->execute(runtime, didUserCallbackTimeout);

  if (result.isObject() && result.getObject(runtime).isFunction(runtime)) {
    // If the task returned a continuation callback, we re-assign it to the task
    // and keep the task in the queue.
    task->callback = result.getObject(runtime).getFunction(runtime);
  }

  // TODO execute microtasks
  // TODO report long tasks
  // TODO update rendering
}

} // namespace facebook::react
