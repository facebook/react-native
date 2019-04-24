/*
 * Copyright 2016-present Facebook, Inc.
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
#include <folly/experimental/observer/detail/ObserverManager.h>

#include <folly/ExceptionString.h>
#include <folly/Format.h>
#include <folly/MPMCQueue.h>
#include <folly/Range.h>
#include <folly/Singleton.h>
#include <folly/portability/GFlags.h>
#include <folly/system/ThreadName.h>

namespace folly {
namespace observer_detail {

FOLLY_TLS bool ObserverManager::inManagerThread_{false};
FOLLY_TLS ObserverManager::DependencyRecorder::Dependencies*
    ObserverManager::DependencyRecorder::currentDependencies_{nullptr};

DEFINE_int32(
    observer_manager_pool_size,
    4,
    "How many internal threads ObserverManager should use");

static constexpr StringPiece kObserverManagerThreadNamePrefix{"ObserverMngr"};

namespace {
constexpr size_t kCurrentQueueSize{10 * 1024};
constexpr size_t kNextQueueSize{10 * 1024};
} // namespace

class ObserverManager::CurrentQueue {
 public:
  CurrentQueue() : queue_(kCurrentQueueSize) {
    if (FLAGS_observer_manager_pool_size < 1) {
      LOG(ERROR) << "--observer_manager_pool_size should be >= 1";
      FLAGS_observer_manager_pool_size = 1;
    }
    for (int32_t i = 0; i < FLAGS_observer_manager_pool_size; ++i) {
      threads_.emplace_back([this, i]() {
        folly::setThreadName(
            folly::sformat("{}{}", kObserverManagerThreadNamePrefix, i));
        ObserverManager::inManagerThread_ = true;

        while (true) {
          Function<void()> task;
          queue_.blockingRead(task);

          if (!task) {
            return;
          }

          try {
            task();
          } catch (...) {
            LOG(ERROR) << "Exception while running CurrentQueue task: "
                       << exceptionStr(std::current_exception());
          }
        }
      });
    }
  }

  ~CurrentQueue() {
    for (size_t i = 0; i < threads_.size(); ++i) {
      queue_.blockingWrite(nullptr);
    }

    for (auto& thread : threads_) {
      thread.join();
    }

    CHECK(queue_.isEmpty());
  }

  void add(Function<void()> task) {
    if (ObserverManager::inManagerThread()) {
      if (!queue_.write(std::move(task))) {
        throw std::runtime_error("Too many Observers scheduled for update.");
      }
    } else {
      queue_.blockingWrite(std::move(task));
    }
  }

 private:
  MPMCQueue<Function<void()>> queue_;
  std::vector<std::thread> threads_;
};

class ObserverManager::NextQueue {
 public:
  explicit NextQueue(ObserverManager& manager)
      : manager_(manager), queue_(kNextQueueSize) {
    thread_ = std::thread([&]() {
      Core::WeakPtr queueCoreWeak;

      while (true) {
        queue_.blockingRead(queueCoreWeak);
        if (stop_) {
          return;
        }

        std::vector<Core::Ptr> cores;
        {
          auto queueCore = queueCoreWeak.lock();
          if (!queueCore) {
            continue;
          }
          cores.emplace_back(std::move(queueCore));
        }

        {
          SharedMutexReadPriority::WriteHolder wh(manager_.versionMutex_);

          // We can't pick more tasks from the queue after we bumped the
          // version, so we have to do this while holding the lock.
          while (cores.size() < kNextQueueSize && queue_.read(queueCoreWeak)) {
            if (stop_) {
              return;
            }
            if (auto queueCore = queueCoreWeak.lock()) {
              cores.emplace_back(std::move(queueCore));
            }
          }

          ++manager_.version_;
        }

        for (auto& core : cores) {
          manager_.scheduleRefresh(std::move(core), manager_.version_, true);
        }
      }
    });
  }

  void add(Core::WeakPtr core) {
    queue_.blockingWrite(std::move(core));
  }

  ~NextQueue() {
    stop_ = true;
    // Write to the queue to notify the thread.
    queue_.blockingWrite(Core::WeakPtr());
    thread_.join();
  }

 private:
  ObserverManager& manager_;
  MPMCQueue<Core::WeakPtr> queue_;
  std::thread thread_;
  std::atomic<bool> stop_{false};
};

ObserverManager::ObserverManager() {
  currentQueue_ = std::make_unique<CurrentQueue>();
  nextQueue_ = std::make_unique<NextQueue>(*this);
}

ObserverManager::~ObserverManager() {
  // Destroy NextQueue, before the rest of this object, since it expects
  // ObserverManager to be alive.
  nextQueue_.reset();
  currentQueue_.reset();
}

void ObserverManager::scheduleCurrent(Function<void()> task) {
  currentQueue_->add(std::move(task));
}

void ObserverManager::scheduleNext(Core::WeakPtr core) {
  nextQueue_->add(std::move(core));
}

struct ObserverManager::Singleton {
  static folly::Singleton<ObserverManager> instance;
  // MSVC 2015 doesn't let us access ObserverManager's constructor if we
  // try to use a lambda to initialize instance, so we have to create
  // an actual function instead.
  static ObserverManager* createManager() {
    return new ObserverManager();
  }
};

folly::Singleton<ObserverManager> ObserverManager::Singleton::instance(
    createManager);

std::shared_ptr<ObserverManager> ObserverManager::getInstance() {
  return Singleton::instance.try_get();
}
} // namespace observer_detail
} // namespace folly
