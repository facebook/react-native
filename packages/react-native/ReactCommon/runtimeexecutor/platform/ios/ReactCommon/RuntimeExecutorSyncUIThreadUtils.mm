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
#import <thread>

namespace facebook::react {
namespace {
class UITask {
  std::promise<void> _isDone;
  std::function<void()> _uiWork;
  std::atomic_bool _wasStarted;
  std::thread::id _threadId;

 public:
  UITask(std::function<void()> uiWork) : _uiWork(uiWork), _wasStarted(false), _threadId(std::this_thread::get_id()) {}

  void run()
  {
    auto expected = false;
    if (!_wasStarted.compare_exchange_strong(expected, true)) {
      return;
    }
    OnScopeExit onScopeExit(^{
      _uiWork = nullptr;
      _isDone.set_value();
    });
    _uiWork();
  }

  bool wasStarted()
  {
    return _wasStarted.load();
  }

  void waitUntilDone()
  {
    return _isDone.get_future().wait();
  }

  std::thread::id getThreadId()
  {
    return _threadId;
  }
};

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

std::vector<std::shared_ptr<UITask>> &g_postedUITasks()
{
  static std::vector<std::shared_ptr<UITask>> postedUITasks;
  return postedUITasks;
}

bool &g_isRunningUITask()
{
  static bool isRunningUITask = false;
  return isRunningUITask;
}

bool isJSThread()
{
  return [[NSThread currentThread].name containsString:@"JavaScript"];
}

void saferExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&jsWork) noexcept
{
  react_native_assert([[NSThread currentThread] isMainThread] && !g_isRunningUITask());

  jsi::Runtime *runtime = nullptr;
  std::promise<void> jsWorkDone;

  runtimeExecutor([&](jsi::Runtime &rt) {
    runtime = &rt;
    g_cv().notify_one();

    // Wait until jsWork is done.
    jsWorkDone.get_future().wait();
  });

  while (true) {
    std::vector<std::shared_ptr<UITask>> postedUITasks;

    // Wait for uitask or runtime to be available.
    {
      std::unique_lock<std::mutex> lock(g_mutex());
      g_cv().wait(lock, [&] { return runtime != nullptr || g_postedUITasks().size() != 0; });
      postedUITasks = g_postedUITasks();
      g_postedUITasks().clear();
    }

    if (postedUITasks.size() != 0) {
      for (auto &postedUITask : postedUITasks) {
        g_isRunningUITask() = true;
        OnScopeExit onScopeExit([&]() { g_isRunningUITask() = false; });
        postedUITask->run();
      }
    } else {
      break;
    }
  }

  OnScopeExit onScopeExit([&]() { jsWorkDone.set_value(); });
  jsWork(*runtime);
}

/*
 * Example order of events (when not a sync call in runtimeExecutor
 * jsWork):
 * - [UI thread] Lock all mutexes at start
 * - [UI thread] Schedule "runtime capture block" on js thread
 * - [UI thread] Wait for runtime capture: runtimeCaptured.lock()
 * - [JS thread] Capture runtime by setting runtimePtr
 * - [JS thread] Signal runtime captured: runtimeCaptured.unlock()
 * - [UI thread] Call jsWork using runtimePtr
 * - [JS thread] Wait until jsWork done: jsWorkDone.lock()
 * - [UI thread] Signal jsWork done: jsWorkDone.unlock()
 * - [UI thread] Wait until runtime capture block finished:
 *               runtimeCaptureBlockDone.lock()
 * - [JS thread] Signal runtime capture block is finished:
 *               runtimeCaptureBlockDone.unlock()
 */
void legacyExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&jsWork) noexcept
{
  // Note: We need the third mutex to get back to the main thread before
  // the lambda is finished (because all mutexes are allocated on the stack).

  std::mutex runtimeCaptured;
  std::mutex jsWorkDone;
  std::mutex runtimeCaptureBlockDone;

  runtimeCaptured.lock();
  jsWorkDone.lock();
  runtimeCaptureBlockDone.lock();

  jsi::Runtime *runtimePtr = nullptr;

  auto threadId = std::this_thread::get_id();
  auto runtimeCaptureBlock = [&](jsi::Runtime &runtime) {
    runtimePtr = &runtime;

    if (threadId == std::this_thread::get_id()) {
      // In case of a synchronous call, we should unlock mutexes and return.
      runtimeCaptured.unlock();
      runtimeCaptureBlockDone.unlock();
      return;
    }

    runtimeCaptured.unlock();
    // `jsWork` is called somewhere here.
    jsWorkDone.lock();
    runtimeCaptureBlockDone.unlock();
  };
  runtimeExecutor(std::move(runtimeCaptureBlock));

  runtimeCaptured.lock();
  jsWork(*runtimePtr);
  jsWorkDone.unlock();
  runtimeCaptureBlockDone.lock();
}

} // namespace

void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&jsWork) noexcept
{
  if (ReactNativeFeatureFlags::enableSaferMainQueueSyncDispatchOnIOS()) {
    saferExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(runtimeExecutor, std::move(jsWork));
  } else {
    legacyExecuteSynchronouslyOnSameThread_CAN_DEADLOCK(runtimeExecutor, std::move(jsWork));
  }
}

void unsafeExecuteOnMainThreadSync(std::function<void()> work)
{
  react_native_assert(isJSThread());
  {
    std::lock_guard lock(g_mutex());
    for (const auto &uiTask : g_postedUITasks()) {
      if (std::this_thread::get_id() == uiTask->getThreadId()) {
        react_native_assert(uiTask->wasStarted());
      }
    }
  }

  auto uiTask = std::make_shared<UITask>(work);
  dispatch_async(dispatch_get_main_queue(), ^{
    g_isRunningUITask() = true;
    OnScopeExit onScopeExit([&]() {
      g_isRunningUITask() = false;

      std::lock_guard<std::mutex> lock(g_mutex());
      auto it = std::find(g_postedUITasks().begin(), g_postedUITasks().end(), uiTask);
      if (it != g_postedUITasks().end()) {
        g_postedUITasks().erase(it);
      }
    });
    uiTask->run();
  });

  // post ui task to main thread
  {
    std::lock_guard<std::mutex> lock(g_mutex());
    g_postedUITasks().push_back(uiTask);
    g_cv().notify_one();
  }

  uiTask->waitUntilDone();
}

} // namespace facebook::react
