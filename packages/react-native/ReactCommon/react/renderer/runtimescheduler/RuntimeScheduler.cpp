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

#include <cxxreact/ErrorUtils.h>
#include <cxxreact/SystraceSection.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <utility>

namespace facebook::react {

namespace {
std::unique_ptr<RuntimeSchedulerBase> getRuntimeSchedulerImplementation(
    RuntimeExecutor runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now,
    RuntimeSchedulerTaskErrorHandler onTaskError) {
  if (ReactNativeFeatureFlags::enableBridgelessArchitecture() &&
      !ReactNativeFeatureFlags::disableEventLoopOnBridgeless()) {
    return std::make_unique<RuntimeScheduler_Modern>(
        std::move(runtimeExecutor), std::move(now), std::move(onTaskError));
  } else {
    return std::make_unique<RuntimeScheduler_Legacy>(
        std::move(runtimeExecutor), std::move(now), std::move(onTaskError));
  }
}

} // namespace

RuntimeScheduler::RuntimeScheduler(
    RuntimeExecutor runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now,
    RuntimeSchedulerTaskErrorHandler onTaskError)
    : runtimeSchedulerImpl_(getRuntimeSchedulerImplementation(
          std::move(runtimeExecutor),
          std::move(now),
          std::move(onTaskError))) {}

/* static */ void RuntimeScheduler::handleTaskErrorDefault(
    jsi::Runtime& runtime,
    jsi::JSError& error) {
  handleJSError(runtime, error, true);
}

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

bool RuntimeScheduler::getShouldYield() noexcept {
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
    SurfaceId surfaceId,
    RuntimeSchedulerRenderingUpdate&& renderingUpdate) {
  return runtimeSchedulerImpl_->scheduleRenderingUpdate(
      surfaceId, std::move(renderingUpdate));
}

void RuntimeScheduler::setShadowTreeRevisionConsistencyManager(
    ShadowTreeRevisionConsistencyManager*
        shadowTreeRevisionConsistencyManager) {
  return runtimeSchedulerImpl_->setShadowTreeRevisionConsistencyManager(
      shadowTreeRevisionConsistencyManager);
}

void RuntimeScheduler::setPerformanceEntryReporter(
    PerformanceEntryReporter* performanceEntryReporter) {
  return runtimeSchedulerImpl_->setPerformanceEntryReporter(
      performanceEntryReporter);
}

void RuntimeScheduler::setEventTimingDelegate(
    RuntimeSchedulerEventTimingDelegate* eventTimingDelegate) {
  return runtimeSchedulerImpl_->setEventTimingDelegate(eventTimingDelegate);
}

} // namespace facebook::react
