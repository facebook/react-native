/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactCommon/RuntimeExecutorSyncUIThreadUtils.h>
#import <react/debug/react_native_assert.h>
#import <react/utils/OnScopeExit.h>
#import <functional>
#import <mutex>

namespace {
struct UITask {
  std::promise<void> _isDone;
  std::mutex _mutex;
  std::function<void()> _uiWork;
  std::atomic_bool _hasStarted;

 public:
  UITask(std::function<void()> uiWork) : _uiWork(uiWork), _hasStarted(false) {}

  void run()
  {
    bool expected = false;
    if (!_hasStarted.compare_exchange_strong(expected, true)) {
      return;
    }
    facebook::react::OnScopeExit onScopeExit(^{
      _uiWork = nil;
      _isDone.set_value();
    });
    _uiWork();
  }

  bool hasStarted()
  {
    return _hasStarted.load();
  }

  std::future<void> getFuture()
  {
    return _isDone.get_future();
  }
};

static std::mutex _mutex;
static std::condition_variable _cv;

// Global state
static bool _isRunningPendingUITask = false;
static std::shared_ptr<UITask> _pendingUITask;

void runPendingUITask()
{
  facebook::react::OnScopeExit onScopeExit([&]() {
    _pendingUITask = nullptr;
    _isRunningPendingUITask = false;
  });
  _isRunningPendingUITask = true;
  _pendingUITask->run();
}
} // namespace

namespace facebook::react {
void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&jsWork) noexcept
{
  react_native_assert([[NSThread currentThread] isMainThread] && !_isRunningPendingUITask);

  jsi::Runtime *runtime = nullptr;
  std::mutex jsWorkDone;
  jsWorkDone.lock();

  {
    std::unique_lock<std::mutex> lock(_mutex);
    if (_pendingUITask) {
      runPendingUITask();
    }

    runtimeExecutor([&](jsi::Runtime &rt) {
      {
        std::lock_guard<std::mutex> lock(_mutex);
        runtime = &rt;
        _cv.notify_one();
      }

      // Block the js thread until jsWork finishes on calling thread
      jsWorkDone.lock();
    });

    while (true) {
      _cv.wait(lock, [&] { return runtime != nullptr || _pendingUITask != nullptr; });

      if (_pendingUITask != nullptr) {
        runPendingUITask();
      } else {
        break;
      }
    }
  }

  jsWork(*runtime);
  jsWorkDone.unlock();
}

std::future<void> schedulePotentiallyDeadlockingUITask(std::function<void()> work)
{
  std::lock_guard<std::mutex> lock(_mutex);
  react_native_assert((!_pendingUITask || _pendingUITask->hasStarted()));

  auto uiTask = std::make_shared<UITask>(work);
  dispatch_async(dispatch_get_main_queue(), ^{
    uiTask->run();
  });

  _pendingUITask = uiTask;
  _cv.notify_one();
  return uiTask->getFuture();
}

} // namespace facebook::react
