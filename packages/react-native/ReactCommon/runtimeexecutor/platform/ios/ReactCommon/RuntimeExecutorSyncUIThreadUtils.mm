/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactCommon/RuntimeExecutorSyncUIThreadUtils.h>
#import <react/debug/react_native_assert.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/utils/OnScopeExit.h>
#import <algorithm>
#import <functional>
#import <future>
#import <mutex>
#import <optional>
#import <thread>

namespace facebook::react {

namespace {
class UITask {
  std::promise<void> _isDone;
  std::function<void()> _uiWork;

 public:
  UITask(UITask &&other) = default;
  UITask &operator=(UITask &&other) = default;
  UITask(const UITask &) = delete;
  UITask &operator=(const UITask &) = delete;
  ~UITask() = default;

  UITask(std::function<void()> &&uiWork) : _uiWork(std::move(uiWork)) {}

  void operator()()
  {
    if (!_uiWork) {
      return;
    }
    OnScopeExit onScopeExit(^{
      _uiWork = nullptr;
      _isDone.set_value();
    });
    _uiWork();
  }

  std::future<void> future()
  {
    return _isDone.get_future();
  }
};

// Protects access to g_uiTask
std::mutex &g_mutex()
{
  static std::mutex mutex;
  return mutex;
}

std::condition_variable &g_cv()
{
  static std::condition_variable cv;
  return cv;
}

std::mutex &g_ticket()
{
  static std::mutex ticket;
  return ticket;
}

std::optional<UITask> &g_uiTask()
{
  static std::optional<UITask> uiTaskQueue;
  return uiTaskQueue;
}

// Must be called holding g_mutex();
bool hasUITask()
{
  return g_uiTask().has_value();
}

// Must be called holding g_mutex();
UITask takeUITask()
{
  react_native_assert(hasUITask());
  auto uiTask = std::move(*g_uiTask());
  g_uiTask() = std::nullopt;
  return uiTask;
}

// Must be called holding g_mutex();
UITask &postUITask(std::function<void()> &&uiWork)
{
  react_native_assert(!hasUITask());
  g_uiTask() = UITask(std::move(uiWork));
  g_cv().notify_one();
  return *g_uiTask();
}

bool g_isRunningUITask = false;
void runUITask(UITask &uiTask)
{
  react_native_assert([[NSThread currentThread] isMainThread]);
  g_isRunningUITask = true;
  OnScopeExit onScopeExit([]() { g_isRunningUITask = false; });
  uiTask();
}

/**
 * This method is resilient to multiple javascript threads.
 * This can happen when multiple react instances interleave.
 *
 * The extension from 1 js thread to n: All js threads race to
 * get a ticket to post a ui task. The first one to get the ticket
 * will post the ui task, and go to sleep. The cooridnator or
 * main queue will execute that ui task, waking up the js thread
 * and releasing that ticket. Another js thread will get the ticket.
 *
 * For simplicity, we will just use this algorithm for all bg threads.
 * Not just the js thread.
 */
void saferExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&runtimeWork)
{
  react_native_assert([[NSThread currentThread] isMainThread] && !g_isRunningUITask);

  jsi::Runtime *runtime = nullptr;
  std::promise<void> runtimeWorkDone;

  runtimeExecutor([&runtime, runtimeWorkDoneFuture = runtimeWorkDone.get_future().share()](jsi::Runtime &rt) {
    {
      std::lock_guard<std::mutex> lock(g_mutex());
      runtime = &rt;
      g_cv().notify_one();
    }

    runtimeWorkDoneFuture.wait();
  });

  while (true) {
    std::unique_lock<std::mutex> lock(g_mutex());
    g_cv().wait(lock, [&] { return runtime != nullptr || hasUITask(); });
    if (runtime != nullptr) {
      break;
    }

    auto uiTask = takeUITask();
    lock.unlock();
    runUITask(uiTask);
  }

  OnScopeExit onScopeExit([&]() { runtimeWorkDone.set_value(); });
  // Calls into runtime scheduler, which takes care of error handling
  runtimeWork(*runtime);
}

/*
 * Schedules `runtimeWork` to be executed on the same thread using the
 * `RuntimeExecutor`, and blocks on its completion.
 *
 * Example:
 * - [UI thread] Schedule `runtimeCaptureBlock` on js thread
 * - [UI thread] Wait for runtime capture: await(runtime)
 * - [JS thread] Capture runtime for ui thread: resolve(runtime, &rt);
 * - [JS thread] Wait until runtimeWork done: await(runtimeWorkDone)
 * - [UI thread] Call runtimeWork: runtimeWork(*runtimePrt);
 * - [UI thread] Signal runtimeWork done: resolve(runtimeWorkDone)
 * - [UI thread] Wait until runtime capture block finished:
 *               await(runtimeCaptureBlockDone);
 * - [JS thread] Signal runtime capture block is finished:
 *               resolve(runtimeCaptureBlockDone);
 */
void legacyExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor &runtimeExecutor,
    std::function<void(jsi::Runtime &)> &&runtimeWork)
{
  std::promise<jsi::Runtime *> runtime;
  std::promise<void> runtimeCaptureBlockDone;
  std::promise<void> runtimeWorkDone;

  auto callingThread = std::this_thread::get_id();

  auto runtimeCaptureBlock = [&](jsi::Runtime &rt) {
    runtime.set_value(&rt);

    auto runtimeThread = std::this_thread::get_id();
    if (callingThread != runtimeThread) {
      // Block `runtimeThread` on execution of `runtimeWork` on `callingThread`.
      runtimeWorkDone.get_future().wait();
    }

    // TODO(T225331233): This is likely unnecessary. Remove it.
    runtimeCaptureBlockDone.set_value();
  };
  runtimeExecutor(std::move(runtimeCaptureBlock));

  jsi::Runtime *runtimePtr = runtime.get_future().get();
  runtimeWork(*runtimePtr);
  runtimeWorkDone.set_value();

  // TODO(T225331233): This is likely unnecessary. Remove it.
  runtimeCaptureBlockDone.get_future().wait();
}

} // namespace

void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor &runtimeExecutor,
    std::function<void(jsi::Runtime &)> &&runtimeWork)
{
  if (ReactNativeFeatureFlags::enableMainQueueCoordinatorOnIOS()) {
    saferExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(runtimeExecutor, std::move(runtimeWork));
  } else {
    legacyExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(runtimeExecutor, std::move(runtimeWork));
  }
}

/**
 * This method is resilient to multiple javascript threads.
 * This can happen when multiple react instances interleave.
 *
 * The extension from 1 js thread to n: All js threads race to
 * get a ticket to post a ui task. The first one to get the ticket
 * will post the ui task, and go to sleep. The cooridnator or
 * main queue will execute that ui task, waking up the js thread
 * and releasing that ticket. Another js thread will get the ticket.
 *
 * For simplicity, we will just use this method for all bg threads.
 * Not just the js thread.
 */
void unsafeExecuteOnMainThreadSync(std::function<void()> work)
{
  std::lock_guard<std::mutex> ticket(g_ticket());

  std::future<void> isDone;
  {
    std::lock_guard<std::mutex> lock(g_mutex());
    isDone = postUITask(std::move(work)).future();
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    std::unique_lock<std::mutex> lock(g_mutex());
    if (!hasUITask()) {
      return;
    }

    auto uiTask = takeUITask();
    lock.unlock();
    runUITask(uiTask);
  });

  isDone.wait();
}

} // namespace facebook::react
