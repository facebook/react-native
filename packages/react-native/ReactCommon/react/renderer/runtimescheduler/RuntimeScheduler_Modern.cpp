/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler_Modern.h"
#include "SchedulerPriorityUtils.h"

#include <cxxreact/SystraceSection.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/consistency/ScopedShadowTreeRevisionLock.h>
#include <react/timing/primitives.h>
#include <react/utils/OnScopeExit.h>
#include <utility>

namespace facebook::react {

namespace {
std::chrono::milliseconds getResolvedTimeoutForIdleTask(
    std::chrono::milliseconds customTimeout) {
  return customTimeout <
          timeoutForSchedulerPriority(SchedulerPriority::IdlePriority)
      ? timeoutForSchedulerPriority(SchedulerPriority::LowPriority) +
          customTimeout
      : customTimeout;
}
} // namespace

#pragma mark - Public

RuntimeScheduler_Modern::RuntimeScheduler_Modern(
    RuntimeExecutor runtimeExecutor,
    std::function<RuntimeSchedulerTimePoint()> now,
    RuntimeSchedulerTaskErrorHandler onTaskError)
    : runtimeExecutor_(std::move(runtimeExecutor)),
      now_(std::move(now)),
      onTaskError_(std::move(onTaskError)) {}

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

std::shared_ptr<Task> RuntimeScheduler_Modern::scheduleIdleTask(
    jsi::Function&& callback,
    RuntimeSchedulerTimeout customTimeout) noexcept {
  SystraceSection s(
      "RuntimeScheduler::scheduleIdleTask",
      "customTimeout",
      customTimeout.count(),
      "callbackType",
      "jsi::Function");

  auto timeout = getResolvedTimeoutForIdleTask(customTimeout);
  auto expirationTime = now_() + timeout;
  auto task = std::make_shared<Task>(
      SchedulerPriority::IdlePriority, std::move(callback), expirationTime);

  scheduleTask(task);

  return task;
}

std::shared_ptr<Task> RuntimeScheduler_Modern::scheduleIdleTask(
    RawCallback&& callback,
    RuntimeSchedulerTimeout customTimeout) noexcept {
  SystraceSection s(
      "RuntimeScheduler::scheduleIdleTask",
      "customTimeout",
      customTimeout.count(),
      "callbackType",
      "RawCallback");

  auto expirationTime = now_() + getResolvedTimeoutForIdleTask(customTimeout);
  auto task = std::make_shared<Task>(
      SchedulerPriority::IdlePriority, std::move(callback), expirationTime);

  scheduleTask(task);

  return task;
}

bool RuntimeScheduler_Modern::getShouldYield() noexcept {
  std::shared_lock lock(schedulingMutex_);

  if (ReactNativeFeatureFlags::enableLongTaskAPI()) {
    markYieldingOpportunity(now_());
  }

  return syncTaskRequests_ > 0 ||
      (!taskQueue_.empty() && taskQueue_.top().get() != currentTask_);
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

  static thread_local jsi::Runtime* runtimePtr = nullptr;

  auto currentTime = now_();
  auto priority = SchedulerPriority::ImmediatePriority;
  auto expirationTime = currentTime + timeoutForSchedulerPriority(priority);
  Task task{priority, std::move(callback), expirationTime};

  if (runtimePtr == nullptr) {
    syncTaskRequests_++;
    executeSynchronouslyOnSameThread_CAN_DEADLOCK(
        runtimeExecutor_,
        [this, currentTime, &task](jsi::Runtime& runtime) mutable {
          SystraceSection s2(
              "RuntimeScheduler::executeNowOnTheSameThread callback");

          syncTaskRequests_--;
          runtimePtr = &runtime;
          runEventLoopTick(runtime, task, currentTime);
          runtimePtr = nullptr;
        });

  } else {
    // Protecting against re-entry into `executeNowOnTheSameThread` from within
    // `executeNowOnTheSameThread`. Without accounting for re-rentry, a deadlock
    // will occur when trying to gain access to the runtime.
    return runEventLoopTick(*runtimePtr, task, currentTime);
  }

  bool shouldScheduleEventLoop = false;

  {
    // Unique access because we might write to `isEventLoopScheduled_`.
    std::unique_lock lock(schedulingMutex_);

    // We only need to schedule the event loop if there any remaining tasks
    // in the queue.
    if (!taskQueue_.empty() && !isEventLoopScheduled_) {
      isEventLoopScheduled_ = true;
      shouldScheduleEventLoop = true;
    }
  }

  if (shouldScheduleEventLoop) {
    scheduleEventLoop();
  }
}

void RuntimeScheduler_Modern::callExpiredTasks(jsi::Runtime& runtime) {
  // If we have first-class support for microtasks, this a no-op.
  if (ReactNativeFeatureFlags::enableMicrotasks()) {
    return;
  }

  SystraceSection s("RuntimeScheduler::callExpiredTasks");
  runEventLoop(runtime, true);
}

void RuntimeScheduler_Modern::scheduleRenderingUpdate(
    SurfaceId surfaceId,
    RuntimeSchedulerRenderingUpdate&& renderingUpdate) {
  SystraceSection s("RuntimeScheduler::scheduleRenderingUpdate");

  if (ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop()) {
    surfaceIdsWithPendingRenderingUpdates_.insert(surfaceId);
    pendingRenderingUpdates_.push(renderingUpdate);
  } else {
    if (renderingUpdate != nullptr) {
      renderingUpdate();
    }
  }
}

void RuntimeScheduler_Modern::setShadowTreeRevisionConsistencyManager(
    ShadowTreeRevisionConsistencyManager*
        shadowTreeRevisionConsistencyManager) {
  shadowTreeRevisionConsistencyManager_ = shadowTreeRevisionConsistencyManager;
}

void RuntimeScheduler_Modern::setPerformanceEntryReporter(
    PerformanceEntryReporter* performanceEntryReporter) {
  performanceEntryReporter_ = performanceEntryReporter;
}

void RuntimeScheduler_Modern::setEventTimingDelegate(
    RuntimeSchedulerEventTimingDelegate* eventTimingDelegate) {
  eventTimingDelegate_ = eventTimingDelegate;
}

#pragma mark - Private

void RuntimeScheduler_Modern::scheduleTask(std::shared_ptr<Task> task) {
  bool shouldScheduleEventLoop = false;

  {
    std::unique_lock lock(schedulingMutex_);

    // We only need to schedule the event loop if the task we're about to
    // schedule is the only one in the queue.
    // Otherwise, we don't need to schedule it because there's another one
    // running already that will pick up the new task.
    if (taskQueue_.empty() && !isEventLoopScheduled_) {
      isEventLoopScheduled_ = true;
      shouldScheduleEventLoop = true;
    }

    taskQueue_.push(task);
  }

  if (shouldScheduleEventLoop) {
    scheduleEventLoop();
  }
}

void RuntimeScheduler_Modern::scheduleEventLoop() {
  runtimeExecutor_(
      [this](jsi::Runtime& runtime) { runEventLoop(runtime, false); });
}

void RuntimeScheduler_Modern::runEventLoop(
    jsi::Runtime& runtime,
    bool onlyExpired) {
  SystraceSection s("RuntimeScheduler::runEventLoop");

  auto previousPriority = currentPriority_;

  while (syncTaskRequests_ == 0) {
    auto currentTime = now_();
    auto topPriorityTask = selectTask(currentTime, onlyExpired);

    if (!topPriorityTask) {
      // No pending work to do.
      // Events will restart the loop when necessary.
      break;
    }

    runEventLoopTick(runtime, *topPriorityTask, currentTime);
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
  isEventLoopScheduled_ = false;

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

void RuntimeScheduler_Modern::runEventLoopTick(
    jsi::Runtime& runtime,
    Task& task,
    RuntimeSchedulerTimePoint taskStartTime) {
  SystraceSection s("RuntimeScheduler::runEventLoopTick");

  ScopedShadowTreeRevisionLock revisionLock(
      shadowTreeRevisionConsistencyManager_);

  currentTask_ = &task;
  currentPriority_ = task.priority;

  if (ReactNativeFeatureFlags::enableLongTaskAPI()) {
    lastYieldingOpportunity_ = taskStartTime;
    longestPeriodWithoutYieldingOpportunity_ =
        std::chrono::milliseconds::zero();
  }

  auto didUserCallbackTimeout = task.expirationTime <= taskStartTime;
  executeTask(runtime, task, didUserCallbackTimeout);

  if (ReactNativeFeatureFlags::enableMicrotasks()) {
    // "Perform a microtask checkpoint" step.
    performMicrotaskCheckpoint(runtime);
  }

  if (ReactNativeFeatureFlags::enableLongTaskAPI()) {
    auto taskEndTime = now_();
    markYieldingOpportunity(taskEndTime);
    reportLongTasks(task, taskStartTime, taskEndTime);
  }

  if (ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop()) {
    // "Update the rendering" step.
    updateRendering();
  }

  currentTask_ = nullptr;
}

/**
 * This is partially equivalent to the "Update the rendering" step in the Web
 * event loop. See
 * https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering.
 */
void RuntimeScheduler_Modern::updateRendering() {
  SystraceSection s("RuntimeScheduler::updateRendering");

  if (eventTimingDelegate_ != nullptr &&
      ReactNativeFeatureFlags::enableReportEventPaintTime()) {
    eventTimingDelegate_->dispatchPendingEventTimingEntries(
        surfaceIdsWithPendingRenderingUpdates_);
  }

  surfaceIdsWithPendingRenderingUpdates_.clear();

  while (!pendingRenderingUpdates_.empty()) {
    auto& pendingRenderingUpdate = pendingRenderingUpdates_.front();
    if (pendingRenderingUpdate != nullptr) {
      pendingRenderingUpdate();
    }
    pendingRenderingUpdates_.pop();
  }
}

void RuntimeScheduler_Modern::executeTask(
    jsi::Runtime& runtime,
    Task& task,
    bool didUserCallbackTimeout) const {
  SystraceSection s(
      "RuntimeScheduler::executeTask",
      "priority",
      serialize(task.priority),
      "didUserCallbackTimeout",
      didUserCallbackTimeout);

  try {
    auto result = task.execute(runtime, didUserCallbackTimeout);

    if (result.isObject() && result.getObject(runtime).isFunction(runtime)) {
      // If the task returned a continuation callback, we re-assign it to the
      // task and keep the task in the queue.
      task.callback = result.getObject(runtime).getFunction(runtime);
    }
  } catch (jsi::JSError& error) {
    onTaskError_(runtime, error);
  }
}

/**
 * This is partially equivalent to the "Perform a microtask checkpoint" step in
 * the Web event loop. See
 * https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint.
 *
 * Iterates on \c drainMicrotasks until it completes or hits the retries bound.
 */
void RuntimeScheduler_Modern::performMicrotaskCheckpoint(
    jsi::Runtime& runtime) {
  SystraceSection s("RuntimeScheduler::performMicrotaskCheckpoint");

  if (performingMicrotaskCheckpoint_) {
    return;
  }

  performingMicrotaskCheckpoint_ = true;
  OnScopeExit restoreFlag([&]() { performingMicrotaskCheckpoint_ = false; });

  uint8_t retries = 0;
  // A heuristic number to guard infinite or absurd numbers of retries.
  const static unsigned int kRetriesBound = 255;

  while (retries < kRetriesBound) {
    try {
      // The default behavior of \c drainMicrotasks is unbounded execution.
      // We may want to make it bounded in the future.
      if (runtime.drainMicrotasks()) {
        break;
      }
    } catch (jsi::JSError& error) {
      onTaskError_(runtime, error);
    }
    retries++;
  }

  if (retries == kRetriesBound) {
    throw std::runtime_error("Hits microtasks retries bound.");
  }
}

void RuntimeScheduler_Modern::reportLongTasks(
    const Task& /*task*/,
    RuntimeSchedulerTimePoint startTime,
    RuntimeSchedulerTimePoint endTime) {
  auto reporter = performanceEntryReporter_;
  if (reporter == nullptr) {
    return;
  }

  auto checkedDurationMs =
      chronoToDOMHighResTimeStamp(longestPeriodWithoutYieldingOpportunity_);
  if (checkedDurationMs >= LONG_TASK_DURATION_THRESHOLD_MS) {
    auto durationMs = chronoToDOMHighResTimeStamp(endTime - startTime);
    auto startTimeMs = chronoToDOMHighResTimeStamp(startTime);
    reporter->logLongTaskEntry(startTimeMs, durationMs);
  }
}

void RuntimeScheduler_Modern::markYieldingOpportunity(
    RuntimeSchedulerTimePoint currentTime) {
  auto currentPeriod = currentTime - lastYieldingOpportunity_;
  if (currentPeriod > longestPeriodWithoutYieldingOpportunity_) {
    longestPeriodWithoutYieldingOpportunity_ = currentPeriod;
  }
  lastYieldingOpportunity_ = currentTime;
}

} // namespace facebook::react
