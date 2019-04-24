/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <atomic>
#include <condition_variable>
#include <deque>
#include <map>
#include <memory>
#include <mutex>
#include <thread>

#include <folly/Executor.h>
#include <folly/executors/thread_factory/ThreadFactory.h>

namespace folly {

/***
 *  ThreadedExecutor
 *
 *  An executor for blocking tasks.
 *
 *  This executor runs each task in its own thread. It works well for tasks
 *  which mostly sleep, but works poorly for tasks which mostly compute.
 *
 *  For each task given to the executor with `add`, the executor spawns a new
 *  thread for that task, runs the task in that thread, and joins the thread
 *  after the task has completed.
 *
 *  Spawning and joining task threads are done in the executor's internal
 *  control thread. Calls to `add` put the tasks to be run into a queue, where
 *  the control thread will find them.
 *
 *  There is currently no limitation on, or throttling of, concurrency.
 *
 *  This executor is not currently optimized for performance. For example, it
 *  makes no attempt to re-use task threads. Rather, it exists primarily to
 *  offload sleep-heavy tasks from the CPU executor, where they might otherwise
 *  be run.
 */
class ThreadedExecutor : public virtual folly::Executor {
 public:
  explicit ThreadedExecutor(
      std::shared_ptr<ThreadFactory> threadFactory = newDefaultThreadFactory());
  ~ThreadedExecutor() override;

  ThreadedExecutor(ThreadedExecutor const&) = delete;
  ThreadedExecutor(ThreadedExecutor&&) = delete;

  ThreadedExecutor& operator=(ThreadedExecutor const&) = delete;
  ThreadedExecutor& operator=(ThreadedExecutor&&) = delete;

  void add(Func func) override;

 private:
  static std::shared_ptr<ThreadFactory> newDefaultThreadFactory();

  void notify();
  void control();
  void controlWait();
  bool controlPerformAll();
  void controlJoinFinishedThreads();
  void controlLaunchEnqueuedTasks();

  void work(Func& func);

  std::shared_ptr<ThreadFactory> threadFactory_;

  std::atomic<bool> stopping_{false};

  std::mutex controlm_;
  std::condition_variable controlc_;
  bool controls_ = false;
  std::thread controlt_;

  std::mutex enqueuedm_;
  std::deque<Func> enqueued_;

  //  Accessed only by the control thread, so no synchronization.
  std::map<std::thread::id, std::thread> running_;

  std::mutex finishedm_;
  std::deque<std::thread::id> finished_;
};
} // namespace folly
