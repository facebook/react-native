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

#include <folly/executors/IOExecutor.h>
#include <folly/executors/ThreadPoolExecutor.h>
#include <folly/io/async/EventBaseManager.h>

namespace folly {

/**
 * A Thread Pool for IO bound tasks
 *
 * @note Uses event_fd for notification, and waking an epoll loop.
 * There is one queue (NotificationQueue specifically) per thread/epoll.
 * If the thread is already running and not waiting on epoll,
 * we don't make any additional syscalls to wake up the loop,
 * just put the new task in the queue.
 * If any thread has been waiting for more than a few seconds,
 * its stack is madvised away. Currently however tasks are scheduled round
 * robin on the queues, so unless there is no work going on,
 * this isn't very effective.
 * Since there is one queue per thread, there is hardly any contention
 * on the queues - so a simple spinlock around an std::deque is used for
 * the tasks. There is no max queue size.
 * By default, there is one thread per core - it usually doesn't make sense to
 * have more IO threads than this, assuming they don't block.
 *
 * @note ::getEventBase() will return an EventBase you can schedule IO work on
 * directly, chosen round-robin.
 *
 * @note N.B. For this thread pool, stop() behaves like join() because
 * outstanding tasks belong to the event base and will be executed upon its
 * destruction.
 */
class IOThreadPoolExecutor : public ThreadPoolExecutor, public IOExecutor {
 public:
  explicit IOThreadPoolExecutor(
      size_t numThreads,
      std::shared_ptr<ThreadFactory> threadFactory =
          std::make_shared<NamedThreadFactory>("IOThreadPool"),
      folly::EventBaseManager* ebm = folly::EventBaseManager::get(),
      bool waitForAll = false);

  ~IOThreadPoolExecutor() override;

  void add(Func func) override;
  void add(
      Func func,
      std::chrono::milliseconds expiration,
      Func expireCallback = nullptr) override;

  folly::EventBase* getEventBase() override;

  static folly::EventBase* getEventBase(ThreadPoolExecutor::ThreadHandle*);

  folly::EventBaseManager* getEventBaseManager();

 private:
  struct alignas(hardware_destructive_interference_size) IOThread
      : public Thread {
    IOThread(IOThreadPoolExecutor* pool)
        : Thread(pool), shouldRun(true), pendingTasks(0) {}
    std::atomic<bool> shouldRun;
    std::atomic<size_t> pendingTasks;
    folly::EventBase* eventBase;
    std::mutex eventBaseShutdownMutex_;
  };

  ThreadPtr makeThread() override;
  std::shared_ptr<IOThread> pickThread();
  void threadRun(ThreadPtr thread) override;
  void stopThreads(size_t n) override;
  size_t getPendingTaskCountImpl() override;

  std::atomic<size_t> nextThread_;
  folly::ThreadLocal<std::shared_ptr<IOThread>> thisThread_;
  folly::EventBaseManager* eventBaseManager_;
};

} // namespace folly
