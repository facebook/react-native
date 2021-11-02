/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"
#include "ErrorUtils.h"

namespace facebook {
namespace react {

#pragma mark - Public

RuntimeScheduler::RuntimeScheduler(
    RuntimeExecutor const &runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now)
    : runtimeExecutor_(runtimeExecutor), now_(now) {}

void RuntimeScheduler::scheduleWork(
    std::function<void(jsi::Runtime &)> callback) const {
  if (enableYielding_) {
    shouldYield_ = true;
    runtimeExecutor_(
        [this, callback = std::move(callback)](jsi::Runtime &runtime) {
          shouldYield_ = false;
          callback(runtime);
          startWorkLoop(runtime);
        });
  } else {
    runtimeExecutor_([callback = std::move(callback)](jsi::Runtime &runtime) {
      callback(runtime);
    });
  }
}

std::shared_ptr<Task> RuntimeScheduler::scheduleTask(
    SchedulerPriority priority,
    jsi::Function callback) {
  auto expirationTime = now() + timeoutForSchedulerPriority(priority);
  auto task =
      std::make_shared<Task>(priority, std::move(callback), expirationTime);
  taskQueue_.push(task);

  if (!isCallbackScheduled_ && !isPerformingWork_) {
    isCallbackScheduled_ = true;
    runtimeExecutor_([this](jsi::Runtime &runtime) {
      isCallbackScheduled_ = false;
      startWorkLoop(runtime);
    });
  }

  return task;
}

bool RuntimeScheduler::getShouldYield() const noexcept {
  return shouldYield_;
}

void RuntimeScheduler::cancelTask(const std::shared_ptr<Task> &task) noexcept {
  task->callback.reset();
}

SchedulerPriority RuntimeScheduler::getCurrentPriorityLevel() const noexcept {
  return currentPriority_;
}

RuntimeSchedulerTimePoint RuntimeScheduler::now() const noexcept {
  return now_();
}

void RuntimeScheduler::setEnableYielding(bool enableYielding) {
  enableYielding_ = enableYielding;
}

void RuntimeScheduler::executeNowOnTheSameThread(
    std::function<void(jsi::Runtime &runtime)> callback) const {
  shouldYield_ = true;
  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor_,
      [callback = std::move(callback)](jsi::Runtime &runtime) {
        callback(runtime);
      });
  shouldYield_ = false;
}

#pragma mark - Private

void RuntimeScheduler::startWorkLoop(jsi::Runtime &runtime) const {
  auto previousPriority = currentPriority_;
  isPerformingWork_ = true;
  try {
    while (!taskQueue_.empty()) {
      auto topPriorityTask = taskQueue_.top();
      auto now = now_();
      auto didUserCallbackTimeout = topPriorityTask->expirationTime <= now;

      if (!didUserCallbackTimeout && shouldYield_) {
        // This task hasn't expired and we need to yield.
        break;
      }
      currentPriority_ = topPriorityTask->priority;
      auto result = topPriorityTask->execute(runtime);

      if (result.isObject() && result.getObject(runtime).isFunction(runtime)) {
        topPriorityTask->callback =
            result.getObject(runtime).getFunction(runtime);
      } else {
        if (taskQueue_.top() == topPriorityTask) {
          taskQueue_.pop();
        }
      }
    }
  } catch (jsi::JSError &error) {
    handleFatalError(runtime, error);
  }

  currentPriority_ = previousPriority;
  isPerformingWork_ = false;
}

} // namespace react
} // namespace facebook
