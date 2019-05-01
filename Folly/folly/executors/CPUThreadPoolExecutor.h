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

#include <folly/executors/ThreadPoolExecutor.h>

DECLARE_bool(dynamic_cputhreadpoolexecutor);

namespace folly {

/**
 * A Thread pool for CPU bound tasks.
 *
 * @note A single queue backed by folly/LifoSem and folly/MPMC queue.
 * Because of this contention can be quite high,
 * since all the worker threads and all the producer threads hit
 * the same queue. MPMC queue excels in this situation but dictates a max queue
 * size.
 *
 * @note The default queue throws when full (folly::QueueBehaviorIfFull::THROW),
 * so add() can fail. Furthermore, join() can also fail if the queue is full,
 * because it enqueues numThreads poison tasks to stop the threads. If join() is
 * needed to be guaranteed to succeed PriorityLifoSemMPMCQueue can be used
 * instead, initializing the lowest priority's (LO_PRI) capacity to at least
 * numThreads. Poisons use LO_PRI so if that priority is not used for any user
 * task join() is guaranteed not to encounter a full queue.
 *
 * @note If a blocking queue (folly::QueueBehaviorIfFull::BLOCK) is used, and
 * tasks executing on a given thread pool schedule more tasks, deadlock is
 * possible if the queue becomes full.  Deadlock is also possible if there is
 * a circular dependency among multiple thread pools with blocking queues.
 * To avoid this situation, use non-blocking queue(s), or schedule tasks only
 * from threads not belonging to the given thread pool(s), or use
 * folly::IOThreadPoolExecutor.
 *
 * @note LifoSem wakes up threads in Lifo order - i.e. there are only few
 * threads as necessary running, and we always try to reuse the same few threads
 * for better cache locality.
 * Inactive threads have their stack madvised away. This works quite well in
 * combination with Lifosem - it almost doesn't matter if more threads than are
 * necessary are specified at startup.
 *
 * @note Supports priorities - priorities are implemented as multiple queues -
 * each worker thread checks the highest priority queue first. Threads
 * themselves don't have priorities set, so a series of long running low
 * priority tasks could still hog all the threads. (at last check pthreads
 * thread priorities didn't work very well).
 */
class CPUThreadPoolExecutor : public ThreadPoolExecutor {
 public:
  struct CPUTask;

  CPUThreadPoolExecutor(
      size_t numThreads,
      std::unique_ptr<BlockingQueue<CPUTask>> taskQueue,
      std::shared_ptr<ThreadFactory> threadFactory =
          std::make_shared<NamedThreadFactory>("CPUThreadPool"));

  CPUThreadPoolExecutor(
      std::pair<size_t, size_t> numThreads,
      std::unique_ptr<BlockingQueue<CPUTask>> taskQueue,
      std::shared_ptr<ThreadFactory> threadFactory =
          std::make_shared<NamedThreadFactory>("CPUThreadPool"));

  explicit CPUThreadPoolExecutor(size_t numThreads);

  CPUThreadPoolExecutor(
      size_t numThreads,
      std::shared_ptr<ThreadFactory> threadFactory);

  CPUThreadPoolExecutor(
      std::pair<size_t, size_t> numThreads,
      std::shared_ptr<ThreadFactory> threadFactory);

  CPUThreadPoolExecutor(
      size_t numThreads,
      int8_t numPriorities,
      std::shared_ptr<ThreadFactory> threadFactory =
          std::make_shared<NamedThreadFactory>("CPUThreadPool"));

  CPUThreadPoolExecutor(
      size_t numThreads,
      int8_t numPriorities,
      size_t maxQueueSize,
      std::shared_ptr<ThreadFactory> threadFactory =
          std::make_shared<NamedThreadFactory>("CPUThreadPool"));

  ~CPUThreadPoolExecutor() override;

  void add(Func func) override;
  void add(
      Func func,
      std::chrono::milliseconds expiration,
      Func expireCallback = nullptr) override;

  void addWithPriority(Func func, int8_t priority) override;
  void add(
      Func func,
      int8_t priority,
      std::chrono::milliseconds expiration,
      Func expireCallback = nullptr);

  size_t getTaskQueueSize() const;

  uint8_t getNumPriorities() const override;

  struct CPUTask : public ThreadPoolExecutor::Task {
    // Must be noexcept move constructible so it can be used in MPMCQueue

    explicit CPUTask(
        Func&& f,
        std::chrono::milliseconds expiration,
        Func&& expireCallback)
        : Task(std::move(f), expiration, std::move(expireCallback)),
          poison(false) {}
    CPUTask()
        : Task(nullptr, std::chrono::milliseconds(0), nullptr), poison(true) {}

    bool poison;
  };

  static const size_t kDefaultMaxQueueSize;

 protected:
  BlockingQueue<CPUTask>* getTaskQueue();

 private:
  void threadRun(ThreadPtr thread) override;
  void stopThreads(size_t n) override;
  size_t getPendingTaskCountImpl() override;

  bool tryDecrToStop();
  bool taskShouldStop(folly::Optional<CPUTask>&);

  std::unique_ptr<BlockingQueue<CPUTask>> taskQueue_;
  std::atomic<ssize_t> threadsToStop_{0};
};

} // namespace folly
