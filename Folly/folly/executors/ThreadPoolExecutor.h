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
#include <folly/DefaultKeepAliveExecutor.h>
#include <folly/Memory.h>
#include <folly/SharedMutex.h>
#include <folly/executors/GlobalThreadPoolList.h>
#include <folly/executors/task_queue/LifoSemMPMCQueue.h>
#include <folly/executors/thread_factory/NamedThreadFactory.h>
#include <folly/io/async/Request.h>
#include <folly/portability/GFlags.h>
#include <folly/synchronization/Baton.h>

#include <algorithm>
#include <mutex>
#include <queue>

#include <glog/logging.h>

namespace folly {

/* Base class for implementing threadpool based executors.
 *
 * Dynamic thread behavior:
 *
 * ThreadPoolExecutors may vary their actual running number of threads
 * between minThreads_ and maxThreads_, tracked by activeThreads_.
 * The actual implementation of joining an idle thread is left to the
 * ThreadPoolExecutors' subclass (typically by LifoSem try_take_for
 * timing out).  Idle threads should be removed from threadList_, and
 * threadsToJoin incremented, and activeThreads_ decremented.
 *
 * On task add(), if an executor can garantee there is an active
 * thread that will handle the task, then nothing needs to be done.
 * If not, then ensureActiveThreads() should be called to possibly
 * start another pool thread, up to maxThreads_.
 *
 * ensureJoined() is called on add(), such that we can join idle
 * threads that were destroyed (which can't be joined from
 * themselves).
 */
class ThreadPoolExecutor : public DefaultKeepAliveExecutor {
 public:
  explicit ThreadPoolExecutor(
      size_t maxThreads,
      size_t minThreads,
      std::shared_ptr<ThreadFactory> threadFactory,
      bool isWaitForAll = false);

  ~ThreadPoolExecutor() override;

  void add(Func func) override = 0;
  virtual void
  add(Func func, std::chrono::milliseconds expiration, Func expireCallback) = 0;

  void setThreadFactory(std::shared_ptr<ThreadFactory> threadFactory) {
    CHECK(numThreads() == 0);
    threadFactory_ = std::move(threadFactory);
  }

  std::shared_ptr<ThreadFactory> getThreadFactory() {
    return threadFactory_;
  }

  size_t numThreads();
  void setNumThreads(size_t numThreads);

  // Return actual number of active threads -- this could be different from
  // numThreads() due to ThreadPoolExecutor's dynamic behavior.
  size_t numActiveThreads();

  /*
   * stop() is best effort - there is no guarantee that unexecuted tasks won't
   * be executed before it returns. Specifically, IOThreadPoolExecutor's stop()
   * behaves like join().
   */
  void stop();
  void join();

  /**
   * Execute f against all ThreadPoolExecutors, primarily for retrieving and
   * exporting stats.
   */
  static void withAll(FunctionRef<void(ThreadPoolExecutor&)> f);

  struct PoolStats {
    PoolStats()
        : threadCount(0),
          idleThreadCount(0),
          activeThreadCount(0),
          pendingTaskCount(0),
          totalTaskCount(0),
          maxIdleTime(0) {}
    size_t threadCount, idleThreadCount, activeThreadCount;
    uint64_t pendingTaskCount, totalTaskCount;
    std::chrono::nanoseconds maxIdleTime;
  };

  PoolStats getPoolStats();
  size_t getPendingTaskCount();
  std::string getName();

  struct TaskStats {
    TaskStats() : expired(false), waitTime(0), runTime(0) {}
    bool expired;
    std::chrono::nanoseconds waitTime;
    std::chrono::nanoseconds runTime;
  };

  using TaskStatsCallback = std::function<void(TaskStats)>;
  void subscribeToTaskStats(TaskStatsCallback cb);

  /**
   * Base class for threads created with ThreadPoolExecutor.
   * Some subclasses have methods that operate on these
   * handles.
   */
  class ThreadHandle {
   public:
    virtual ~ThreadHandle() = default;
  };

  /**
   * Observer interface for thread start/stop.
   * Provides hooks so actions can be taken when
   * threads are created
   */
  class Observer {
   public:
    virtual void threadStarted(ThreadHandle*) = 0;
    virtual void threadStopped(ThreadHandle*) = 0;
    virtual void threadPreviouslyStarted(ThreadHandle* h) {
      threadStarted(h);
    }
    virtual void threadNotYetStopped(ThreadHandle* h) {
      threadStopped(h);
    }
    virtual ~Observer() = default;
  };

  void addObserver(std::shared_ptr<Observer>);
  void removeObserver(std::shared_ptr<Observer>);

  void setThreadDeathTimeout(std::chrono::milliseconds timeout) {
    threadTimeout_ = timeout;
  }

 protected:
  // Prerequisite: threadListLock_ writelocked
  void addThreads(size_t n);
  // Prerequisite: threadListLock_ writelocked
  void removeThreads(size_t n, bool isJoin);

  struct TaskStatsCallbackRegistry;

  struct alignas(hardware_destructive_interference_size) Thread
      : public ThreadHandle {
    explicit Thread(ThreadPoolExecutor* pool)
        : id(nextId++),
          handle(),
          idle(true),
          lastActiveTime(std::chrono::steady_clock::now()),
          taskStatsCallbacks(pool->taskStatsCallbacks_) {}

    ~Thread() override = default;

    static std::atomic<uint64_t> nextId;
    uint64_t id;
    std::thread handle;
    bool idle;
    std::chrono::steady_clock::time_point lastActiveTime;
    folly::Baton<> startupBaton;
    std::shared_ptr<TaskStatsCallbackRegistry> taskStatsCallbacks;
  };

  typedef std::shared_ptr<Thread> ThreadPtr;

  struct Task {
    explicit Task(
        Func&& func,
        std::chrono::milliseconds expiration,
        Func&& expireCallback);
    Func func_;
    TaskStats stats_;
    std::chrono::steady_clock::time_point enqueueTime_;
    std::chrono::milliseconds expiration_;
    Func expireCallback_;
    std::shared_ptr<folly::RequestContext> context_;
  };

  static void runTask(const ThreadPtr& thread, Task&& task);

  // The function that will be bound to pool threads. It must call
  // thread->startupBaton.post() when it's ready to consume work.
  virtual void threadRun(ThreadPtr thread) = 0;

  // Stop n threads and put their ThreadPtrs in the stoppedThreads_ queue
  // and remove them from threadList_, either synchronize or asynchronize
  // Prerequisite: threadListLock_ writelocked
  virtual void stopThreads(size_t n) = 0;

  // Join n stopped threads and remove them from waitingForJoinThreads_ queue.
  // Should not hold a lock because joining thread operation may invoke some
  // cleanup operations on the thread, and those cleanup operations may
  // require a lock on ThreadPoolExecutor.
  void joinStoppedThreads(size_t n);

  // Create a suitable Thread struct
  virtual ThreadPtr makeThread() {
    return std::make_shared<Thread>(this);
  }

  // Prerequisite: threadListLock_ readlocked or writelocked
  virtual size_t getPendingTaskCountImpl() = 0;

  class ThreadList {
   public:
    void add(const ThreadPtr& state) {
      auto it = std::lower_bound(
          vec_.begin(),
          vec_.end(),
          state,
          // compare method is a static method of class
          // and therefore cannot be inlined by compiler
          // as a template predicate of the STL algorithm
          // but wrapped up with the lambda function (lambda will be inlined)
          // compiler can inline compare method as well
          [&](const ThreadPtr& ts1, const ThreadPtr& ts2) -> bool { // inline
            return compare(ts1, ts2);
          });
      vec_.insert(it, state);
    }

    void remove(const ThreadPtr& state) {
      auto itPair = std::equal_range(
          vec_.begin(),
          vec_.end(),
          state,
          // the same as above
          [&](const ThreadPtr& ts1, const ThreadPtr& ts2) -> bool { // inline
            return compare(ts1, ts2);
          });
      CHECK(itPair.first != vec_.end());
      CHECK(std::next(itPair.first) == itPair.second);
      vec_.erase(itPair.first);
    }

    const std::vector<ThreadPtr>& get() const {
      return vec_;
    }

   private:
    static bool compare(const ThreadPtr& ts1, const ThreadPtr& ts2) {
      return ts1->id < ts2->id;
    }

    std::vector<ThreadPtr> vec_;
  };

  class StoppedThreadQueue : public BlockingQueue<ThreadPtr> {
   public:
    BlockingQueueAddResult add(ThreadPtr item) override;
    ThreadPtr take() override;
    size_t size() override;
    folly::Optional<ThreadPtr> try_take_for(
        std::chrono::milliseconds /*timeout */) override;

   private:
    folly::LifoSem sem_;
    std::mutex mutex_;
    std::queue<ThreadPtr> queue_;
  };

  std::shared_ptr<ThreadFactory> threadFactory_;
  const bool isWaitForAll_; // whether to wait till event base loop exits

  ThreadList threadList_;
  SharedMutex threadListLock_;
  StoppedThreadQueue stoppedThreads_;
  std::atomic<bool> isJoin_{false}; // whether the current downsizing is a join

  struct TaskStatsCallbackRegistry {
    folly::ThreadLocal<bool> inCallback;
    folly::Synchronized<std::vector<TaskStatsCallback>> callbackList;
  };
  std::shared_ptr<TaskStatsCallbackRegistry> taskStatsCallbacks_;
  std::vector<std::shared_ptr<Observer>> observers_;
  folly::ThreadPoolListHook threadPoolHook_;

  // Dynamic thread sizing functions and variables
  void ensureActiveThreads();
  void ensureJoined();
  bool minActive();
  bool tryTimeoutThread();

  // These are only modified while holding threadListLock_, but
  // are read without holding the lock.
  std::atomic<size_t> maxThreads_{0};
  std::atomic<size_t> minThreads_{0};
  std::atomic<size_t> activeThreads_{0};

  std::atomic<size_t> threadsToJoin_{0};
  std::chrono::milliseconds threadTimeout_{0};

  void joinKeepAliveOnce() {
    if (!std::exchange(keepAliveJoined_, true)) {
      joinKeepAlive();
    }
  }

  bool keepAliveJoined_{false};
};

} // namespace folly
