/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"
#include "RuntimeScheduler_Legacy.h"
#include "RuntimeScheduler_Modern.h"
#include "SchedulerPriorityUtils.h"

#include <cxxreact/SystraceSection.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <utility>

namespace facebook::react {

namespace {
std::unique_ptr<RuntimeSchedulerBase> getRuntimeSchedulerImplementation(
    RuntimeExecutor runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now) {
  if (ReactNativeFeatureFlags::useModernRuntimeScheduler()) {
    return std::make_unique<RuntimeScheduler_Modern>(
        std::move(runtimeExecutor), std::move(now));
  } else {
    return std::make_unique<RuntimeScheduler_Legacy>(
        std::move(runtimeExecutor), std::move(now));
  }
}
} // namespace

RuntimeScheduler::RuntimeScheduler(
    RuntimeExecutor runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now)
    : runtimeSchedulerImpl_(getRuntimeSchedulerImplementation(
          std::move(runtimeExecutor),
          std::move(now))) {}

void RuntimeScheduler::scheduleWork(RawCallback&& callback) noexcept {
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

std::shared_ptr<Task> RuntimeScheduler::scheduleIdleTask(
    jsi::Function&& callback,
    RuntimeSchedulerTimeout timeout) noexcept {
  return runtimeSchedulerImpl_->scheduleIdleTask(std::move(callback), timeout);
}

std::shared_ptr<Task> RuntimeScheduler::scheduleIdleTask(
    RawCallback&& callback,
    RuntimeSchedulerTimeout timeout) noexcept {
  return runtimeSchedulerImpl_->scheduleIdleTask(std::move(callback), timeout);
}

bool RuntimeScheduler::getShouldYield() const noexcept {
  return runtimeSchedulerImpl_->getShouldYield();
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

void RuntimeScheduler::scheduleRenderingUpdate(
    RuntimeSchedulerRenderingUpdate&& renderingUpdate) {
  return runtimeSchedulerImpl_->scheduleRenderingUpdate(
      std::move(renderingUpdate));
}

void RuntimeScheduler::setShadowTreeRevisionConsistencyManager(
    ShadowTreeRevisionConsistencyManager*
        shadowTreeRevisionConsistencyManager) {
  return runtimeSchedulerImpl_->setShadowTreeRevisionConsistencyManager(
      shadowTreeRevisionConsistencyManager);
}

} // namespace facebook::react
