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

#pragma once

#include <future>

#include <folly/Executor.h>
#include <folly/Synchronized.h>
#include <folly/io/async/EventBase.h>
#include <folly/synchronization/Baton.h>

namespace folly {

/**
 * VirtualEventBase implements a light-weight view onto existing EventBase.
 *
 * Multiple VirtualEventBases can be backed by a single EventBase. Similarly
 * to EventBase, VirtualEventBase implements loopKeepAlive() functionality,
 * which allows callbacks holding KeepAlive token to keep EventBase looping
 * until they are complete.
 *
 * VirtualEventBase destructor blocks until all its KeepAliveTokens are released
 * and all tasks scheduled through it are complete. EventBase destructor also
 * blocks until all VirtualEventBases backed by it are released.
 */
class VirtualEventBase : public folly::Executor, public folly::TimeoutManager {
 public:
  explicit VirtualEventBase(EventBase& evb);

  VirtualEventBase(const VirtualEventBase&) = delete;
  VirtualEventBase& operator=(const VirtualEventBase&) = delete;

  ~VirtualEventBase() override;

  EventBase& getEventBase() {
    return *evb_;
  }

  /**
   * Adds the given callback to a queue of things run before destruction
   * of current VirtualEventBase.
   *
   * This allows users of VirtualEventBase that run in it, but don't control it,
   * to be notified before VirtualEventBase gets destructed.
   *
   * Note: this will be called from the loop of the EventBase, backing this
   * VirtualEventBase
   */
  void runOnDestruction(EventBase::LoopCallback* callback);

  /**
   * VirtualEventBase destructor blocks until all tasks scheduled through its
   * runInEventBaseThread are complete.
   *
   * @see EventBase::runInEventBaseThread
   */
  template <typename F>
  void runInEventBaseThread(F&& f) {
    // KeepAlive token has to be released in the EventBase thread. If
    // runInEventBaseThread() fails, we can't extract the KeepAlive token
    // from the callback to properly release it.
    CHECK(evb_->runInEventBaseThread(
        [keepAliveToken = getKeepAliveToken(this),
         f = std::forward<F>(f)]() mutable { f(); }));
  }

  HHWheelTimer& timer() {
    return evb_->timer();
  }

  void attachTimeoutManager(
      AsyncTimeout* obj,
      TimeoutManager::InternalEnum internal) override {
    evb_->attachTimeoutManager(obj, internal);
  }

  void detachTimeoutManager(AsyncTimeout* obj) override {
    evb_->detachTimeoutManager(obj);
  }

  bool scheduleTimeout(AsyncTimeout* obj, TimeoutManager::timeout_type timeout)
      override {
    return evb_->scheduleTimeout(obj, timeout);
  }

  void cancelTimeout(AsyncTimeout* obj) override {
    evb_->cancelTimeout(obj);
  }

  void bumpHandlingTime() override {
    evb_->bumpHandlingTime();
  }

  bool isInTimeoutManagerThread() override {
    return evb_->isInTimeoutManagerThread();
  }

  /**
   * @see runInEventBaseThread
   */
  void add(folly::Func f) override {
    runInEventBaseThread(std::move(f));
  }

  bool inRunningEventBaseThread() const {
    return evb_->inRunningEventBaseThread();
  }

 protected:
  bool keepAliveAcquire() override {
    DCHECK(loopKeepAliveCount_ + loopKeepAliveCountAtomic_.load() > 0);

    if (evb_->inRunningEventBaseThread()) {
      ++loopKeepAliveCount_;
    } else {
      ++loopKeepAliveCountAtomic_;
    }
    return true;
  }

  void keepAliveRelease() override {
    if (!evb_->inRunningEventBaseThread()) {
      return evb_->add([=] { keepAliveRelease(); });
    }
    if (loopKeepAliveCountAtomic_.load()) {
      loopKeepAliveCount_ += loopKeepAliveCountAtomic_.exchange(0);
    }
    DCHECK(loopKeepAliveCount_ > 0);
    if (--loopKeepAliveCount_ == 0) {
      destroyImpl();
    }
  }

 private:
  friend class EventBase;

  ssize_t keepAliveCount() {
    if (loopKeepAliveCountAtomic_.load()) {
      loopKeepAliveCount_ += loopKeepAliveCountAtomic_.exchange(0);
    }
    return loopKeepAliveCount_;
  }

  std::future<void> destroy();
  void destroyImpl();

  using LoopCallbackList = EventBase::LoopCallback::List;

  KeepAlive<EventBase> evb_;

  ssize_t loopKeepAliveCount_{1};
  std::atomic<ssize_t> loopKeepAliveCountAtomic_{0};
  std::promise<void> destroyPromise_;
  std::future<void> destroyFuture_{destroyPromise_.get_future()};
  KeepAlive<VirtualEventBase> loopKeepAlive_{
      makeKeepAlive<VirtualEventBase>(this)};

  folly::Synchronized<LoopCallbackList> onDestructionCallbacks_;
};
} // namespace folly
