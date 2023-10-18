/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"
#include "RuntimeScheduler_Legacy.h"
#include "SchedulerPriorityUtils.h"

#include <react/renderer/debug/SystraceSection.h>
#include <utility>
#include "ErrorUtils.h"

namespace facebook::react {

RuntimeScheduler::RuntimeScheduler(
    RuntimeExecutor runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now)
    : runtimeSchedulerImpl_(std::make_unique<RuntimeScheduler_Legacy>(
          std::move(runtimeExecutor),
          std::move(now))) {}

void RuntimeScheduler::scheduleWork(RawCallback&& callback) const noexcept {
  return runtimeSchedulerImpl_->scheduleWork(std::move(callback));
}

std::shared_ptr<Task> RuntimeScheduler::scheduleTask(
    SchedulerPriority priority,
    jsi::Function&& callback) noexcept {
  return runtimeSchedulerImpl_->scheduleTask(priority, std::move(callback));
}

std::shared_ptr<Task> RuntimeScheduler::scheduleTask(
    SchedulerPriority priority,
    RawCallback&& callback) noexcept {
  return runtimeSchedulerImpl_->scheduleTask(priority, std::move(callback));
}

bool RuntimeScheduler::getShouldYield() const noexcept {
  return runtimeSchedulerImpl_->getShouldYield();
}

bool RuntimeScheduler::getIsSynchronous() const noexcept {
  return runtimeSchedulerImpl_->getIsSynchronous();
}

void RuntimeScheduler::cancelTask(Task& task) noexcept {
  return runtimeSchedulerImpl_->cancelTask(task);
}

SchedulerPriority RuntimeScheduler::getCurrentPriorityLevel() const noexcept {
  return runtimeSchedulerImpl_->getCurrentPriorityLevel();
}

RuntimeSchedulerTimePoint RuntimeScheduler::now() const noexcept {
  return runtimeSchedulerImpl_->now();
}

void RuntimeScheduler::executeNowOnTheSameThread(RawCallback&& callback) {
  return runtimeSchedulerImpl_->executeNowOnTheSameThread(std::move(callback));
}

void RuntimeScheduler::callExpiredTasks(jsi::Runtime& runtime) {
  return runtimeSchedulerImpl_->callExpiredTasks(runtime);
}

} // namespace facebook::react
