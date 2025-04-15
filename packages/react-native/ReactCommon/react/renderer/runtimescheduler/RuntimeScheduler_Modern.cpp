/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler_Modern.h"
#include "SchedulerPriorityUtils.h"

#include <cxxreact/TraceSection.h>
#include <jsinspector-modern/tracing/EventLoopReporter.h>
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
  TraceSection s("RuntimeScheduler::scheduleWork");
  scheduleTask(SchedulerPriority::ImmediatePriority, std::move(callback));
}

std::shared_ptr<Task> RuntimeScheduler_Modern::scheduleTask(
    SchedulerPriority priority,
    jsi::Function&& callback) noexcept {
  TraceSection s(
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
  TraceSection s(
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
  TraceSection s(
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
  TraceSection s(
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

  markYieldingOpportunity(now_());

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
  TraceSection s("RuntimeScheduler::executeNowOnTheSameThread");

  static thread_local jsi::Runtime* runtimePtr = nullptr;

  auto currentTime = now_();
  auto priority = SchedulerPriority::ImmediatePriority;
  auto expirationTime = currentTime + timeoutForSchedulerPriority(priority);
  Task task{priority, std::move(callback), expirationTime};

  if (runtimePtr != nullptr) {
    // Protecting against re-entry into `executeNowOnTheSameThread` from within
    // `executeNowOnTheSameThread`. Without accounting for re-rentry, a deadlock
    // will occur when trying to gain access to the runtime.
    return executeTask(*runtimePtr, task, true);
  }

  syncTaskRequests_++;
  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor_,
      [this, currentTime, &task](jsi::Runtime& runtime) mutable {
        TraceSection s2("RuntimeScheduler::executeNowOnTheSameThread callback");

        syncTaskRequests_--;
        runtimePtr = &runtime;
        runEventLoopTick(runtime, task, currentTime);
        runtimePtr = nullptr;
      });

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
  // No-op in the event loop implementation.
}

void RuntimeScheduler_Modern::scheduleRenderingUpdate(
    SurfaceId surfaceId,
    RuntimeSchedulerRenderingUpdate&& renderingUpdate) {
  TraceSection s("RuntimeScheduler::scheduleRenderingUpdate");

  surfaceIdsWithPendingRenderingUpdates_.insert(surfaceId);
  pendingRenderingUpdates_.push(renderingUpdate);
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

    taskQueue_.push(std::move(task));
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
  TraceSection s("RuntimeScheduler::runEventLoop");

  auto previousPriority = currentPriority_;

  auto currentTime = now_();
  // `selectTask` must be called unconditionaly to ensure that
  // `isEventLoopScheduled_` is set to false and the event loop resume
  // correctly if a synchronous task is scheduled.
  // Unit test normalTaskYieldsToSynchronousAccessAndResumes covers this
  // scenario.
  auto topPriorityTask = selectTask(currentTime, onlyExpired);
  while (topPriorityTask && syncTaskRequests_ == 0) {
    runEventLoopTick(runtime, *topPriorityTask, currentTime);

    currentTime = now_();
    topPriorityTask = selectTask(currentTime, onlyExpired);
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
  TraceSection s("RuntimeScheduler::runEventLoopTick");
  jsinspector_modern::tracing::EventLoopReporter performanceReporter(
      jsinspector_modern::tracing::EventLoopPhase::Task);

  ScopedShadowTreeRevisionLock revisionLock(
      shadowTreeRevisionConsistencyManager_);

  currentTask_ = &task;
  currentPriority_ = task.priority;

  lastYieldingOpportunity_ = taskStartTime;
  longestPeriodWithoutYieldingOpportunity_ = std::chrono::milliseconds::zero();

  auto didUserCallbackTimeout = task.expirationTime <= taskStartTime;
  executeTask(runtime, task, didUserCallbackTimeout);

  // "Perform a microtask checkpoint" step.
  performMicrotaskCheckpoint(runtime);

  auto taskEndTime = now_();
  markYieldingOpportunity(taskEndTime);
  reportLongTasks(task, taskStartTime, taskEndTime);

  // "Update the rendering" step.
  updateRendering();

  currentTask_ = nullptr;
}

/**
 * This is partially equivalent to the "Update the rendering" step in the Web
 * event loop. See
 * https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering.
 */
void RuntimeScheduler_Modern::updateRendering() {
  TraceSection s("RuntimeScheduler::updateRendering");

  if (eventTimingDelegate_ != nullptr) {
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
  TraceSection s(
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
  } catch (std::exception& ex) {
    jsi::JSError error(runtime, std::string("Non-js exception: ") + ex.what());
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
  if (performingMicrotaskCheckpoint_) {
    return;
  }

  TraceSection s("RuntimeScheduler::performMicrotaskCheckpoint");
  jsinspector_modern::tracing::EventLoopReporter performanceReporter(
      jsinspector_modern::tracing::EventLoopPhase::Microtasks);

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
    } catch (std::exception& ex) {
      jsi::JSError error(
          runtime, std::string("Non-js exception: ") + ex.what());
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
    reporter->reportLongTask(startTimeMs, durationMs);
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
