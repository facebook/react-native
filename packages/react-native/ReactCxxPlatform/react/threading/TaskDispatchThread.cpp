/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TaskDispatchThread.h"

#include <folly/portability/SysResource.h>
#include <folly/system/ThreadName.h>
#include <chrono>
#include <future>
#include <utility>

#include <glog/logging.h>

#ifdef ANDROID
#include <fbjni/fbjni.h>
#include <sys/syscall.h>
#endif

namespace facebook::react {

TaskDispatchThread::TaskDispatchThread(
    std::string threadName,
    int priorityOffset) noexcept
    : threadName_(std::move(threadName)) {
#ifdef ANDROID
  // Attaches the thread to JVM just in case anything calls out to Java
  thread_ = std::thread([&]() {
    facebook::jni::ThreadScope::WithClassLoader([&]() {
      int result = setpriority(
          PRIO_PROCESS,
          static_cast<pid_t>(::syscall(SYS_gettid)),
          priorityOffset);

      if (result != 0) {
        LOG(INFO) << " setCurrentThreadPriority failed with pri errno: "
                  << errno;
      }

      loop();
    });
  });

#else
  thread_ = std::thread(&TaskDispatchThread::loop, this);
#endif
}

TaskDispatchThread::~TaskDispatchThread() noexcept {
  quit();
}

bool TaskDispatchThread::isOnThread() noexcept {
  return std::this_thread::get_id() == thread_.get_id();
}

bool TaskDispatchThread::isRunning() noexcept {
  return running_;
}

void TaskDispatchThread::runAsync(
    TaskFn&& task,
    std::chrono::milliseconds delayMs) noexcept {
  if (!running_) {
    return;
  }
  std::lock_guard<std::mutex> guard(queueLock_);
  auto dispatchTime = std::chrono::system_clock::now() + delayMs;
  queue_.emplace(dispatchTime, std::move(task));
  loopCv_.notify_one();
}

void TaskDispatchThread::runSync(TaskFn&& task) noexcept {
  std::promise<void> promise;
  runAsync([&]() {
    if (running_) {
      task();
    }
    promise.set_value();
  });
  promise.get_future().wait();
}

void TaskDispatchThread::quit() noexcept {
  if (!running_) {
    return;
  }
  running_ = false;
  loopCv_.notify_one();
  if (thread_.joinable()) {
    if (!isOnThread()) {
      thread_.join();
    } else {
      thread_.detach();
    }
  }
}

void TaskDispatchThread::loop() noexcept {
  if (!threadName_.empty()) {
    folly::setThreadName(threadName_);
  }
  while (running_) {
    std::unique_lock<std::mutex> lock(queueLock_);
    loopCv_.wait(lock, [&]() { return !running_ || !queue_.empty(); });
    while (!queue_.empty()) {
      auto task = queue_.top();
      auto now = std::chrono::system_clock::now();
      if (task.dispatchTime > now) {
        if (running_) {
          loopCv_.wait_until(lock, task.dispatchTime);
        } else {
          // Shutting down, skip all the delayed tasks that are not to be
          // executed yet
          queue_.pop();
        }
        continue;
      }

      queue_.pop();
      lock.unlock();
      task.fn();
      lock.lock();
    }
  }
}

} //  namespace facebook::react
