/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <pthread.h>
#include <sched.h>
#include <condition_variable>
#include <mutex>
#include <queue>
#include <thread>
#include <utility>

namespace facebook::react::LowPriorityExecutor {

struct LowPriorityExecutorThread {
  LowPriorityExecutorThread() : thread_{std::thread([this] { run(); })} {
    pthread_t hThread = thread_.native_handle();
    struct sched_param param{};
    param.sched_priority = 19; // Higher value means lower priority
    pthread_setschedparam(hThread, SCHED_OTHER, &param);
  }

  // Deleted constructors
  LowPriorityExecutorThread(const LowPriorityExecutorThread& other) = delete;
  LowPriorityExecutorThread(LowPriorityExecutorThread&& other) = delete;
  LowPriorityExecutorThread& operator=(const LowPriorityExecutorThread& other) =
      delete;
  LowPriorityExecutorThread& operator=(LowPriorityExecutorThread&& other) =
      delete;

  ~LowPriorityExecutorThread() {
    // Stop the thread
    {
      std::lock_guard<std::mutex> lock(mutex_);
      running_ = false;
    }

    // Unblock the thread to check the running_ flag and terminate.
    cv_.notify_one();

    // Wait for thread completion to avoid use-after-free on background thread.
    thread_.join();
  }

  void post(std::function<void()>&& workItem) {
    // Move the object to the queue.
    {
      std::lock_guard<std::mutex> lock(mutex_);
      queue_.emplace(std::move(workItem));
    }

    // Notify the background thread.
    cv_.notify_one();
  }

 private:
  void run() {
    pthread_setname_np(pthread_self(), "LowPriorityExecutorThread");

    while (true) {
      std::unique_lock<std::mutex> lock(mutex_);

      // Wait until an object is in the queue or the thread is stopped.
      cv_.wait(lock, [this] { return !queue_.empty() || !running_; });

      // Empty the queue.
      while (!queue_.empty()) {
        queue_.front()();
        queue_.pop();
      }

      // Check if the thread is stopping.
      if (!running_) {
        break;
      }
    }
  }

  std::string threadName_;
  std::thread thread_;
  std::queue<std::function<void()>> queue_;
  std::mutex mutex_;
  std::condition_variable cv_;
  bool running_{true};
};

void execute(std::function<void()>&& workItem) {
  static LowPriorityExecutorThread thread{};
  thread.post(std::move(workItem));
}

} // namespace facebook::react::LowPriorityExecutor
