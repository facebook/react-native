/*
 * Copyright 2014-present Facebook, Inc.
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
#include <folly/futures/ThreadWheelTimekeeper.h>

#include <folly/Singleton.h>
#include <folly/futures/Future.h>
#include <future>

namespace folly {

namespace {
Singleton<ThreadWheelTimekeeper> timekeeperSingleton_;

// Our Callback object for HHWheelTimer
struct WTCallback : public std::enable_shared_from_this<WTCallback>,
                    public folly::HHWheelTimer::Callback {
  struct PrivateConstructorTag {};

 public:
  WTCallback(PrivateConstructorTag, EventBase* base) : base_(base) {}

  // Only allow creation by this factory, to ensure heap allocation.
  static std::shared_ptr<WTCallback> create(EventBase* base) {
    // optimization opportunity: memory pool
    auto cob = std::make_shared<WTCallback>(PrivateConstructorTag{}, base);
    // Capture shared_ptr of cob in lambda so that Core inside Promise will
    // hold a ref count to it. The ref count will be released when Core goes
    // away which happens when both Promise and Future go away
    cob->promise_.setInterruptHandler(
        [cob](exception_wrapper ew) { cob->interruptHandler(std::move(ew)); });
    return cob;
  }

  Future<Unit> getFuture() {
    return promise_.getFuture();
  }

  FOLLY_NODISCARD Promise<Unit> stealPromise() {
    // Don't need promise anymore. Break the circular reference as promise_
    // is holding a ref count to us via Core. Core won't go away until both
    // Promise and Future go away.
    return std::move(promise_);
  }

 protected:
  folly::Synchronized<EventBase*> base_;
  Promise<Unit> promise_;

  void timeoutExpired() noexcept override {
    base_ = nullptr;
    // Don't need Promise anymore, break the circular reference
    auto promise = stealPromise();
    if (!promise.isFulfilled()) {
      promise.setValue();
    }
  }

  void callbackCanceled() noexcept override {
    base_ = nullptr;
    // Don't need Promise anymore, break the circular reference
    auto promise = stealPromise();
    if (!promise.isFulfilled()) {
      promise.setException(FutureNoTimekeeper{});
    }
  }

  void interruptHandler(exception_wrapper ew) {
    auto rBase = base_.rlock();
    if (!*rBase) {
      return;
    }
    // Capture shared_ptr of self in lambda, if we don't do this, object
    // may go away before the lambda is executed from event base thread.
    // This is not racing with timeoutExpired anymore because this is called
    // through Future, which means Core is still alive and keeping a ref count
    // on us, so what timeouExpired is doing won't make the object go away
    (*rBase)->runInEventBaseThread(
        [me = shared_from_this(), ew = std::move(ew)]() mutable {
          me->cancelTimeout();
          // Don't need Promise anymore, break the circular reference
          auto promise = me->stealPromise();
          if (!promise.isFulfilled()) {
            promise.setException(std::move(ew));
          }
        });
  }
};

} // namespace

ThreadWheelTimekeeper::ThreadWheelTimekeeper()
    : thread_([this] { eventBase_.loopForever(); }),
      wheelTimer_(
          HHWheelTimer::newTimer(&eventBase_, std::chrono::milliseconds(1))) {
  eventBase_.waitUntilRunning();
  eventBase_.runInEventBaseThread([this] {
    // 15 characters max
    eventBase_.setName("FutureTimekeepr");
  });
}

ThreadWheelTimekeeper::~ThreadWheelTimekeeper() {
  eventBase_.runInEventBaseThreadAndWait([this] {
    wheelTimer_->cancelAll();
    eventBase_.terminateLoopSoon();
  });
  thread_.join();
}

Future<Unit> ThreadWheelTimekeeper::after(Duration dur) {
  auto cob = WTCallback::create(&eventBase_);
  auto f = cob->getFuture();
  //
  // Even shared_ptr of cob is captured in lambda this is still somewhat *racy*
  // because it will be released once timeout is scheduled. So technically there
  // is no gurantee that EventBase thread can safely call timeout callback.
  // However due to fact that we are having circular reference here:
  // WTCallback->Promise->Core->WTCallbak, so three of them won't go away until
  // we break the circular reference. The break happens either in
  // WTCallback::timeoutExpired or WTCallback::interruptHandler. Former means
  // timeout callback is being safely executed. Latter captures shared_ptr of
  // WTCallback again in another lambda for canceling timeout. The moment
  // canceling timeout is executed in EventBase thread, the actual timeout
  // callback has either been executed, or will never be executed. So we are
  // fine here.
  //
  if (!eventBase_.runInEventBaseThread(
          [this, cob, dur] { wheelTimer_->scheduleTimeout(cob.get(), dur); })) {
    // Release promise to break the circular reference. Because if
    // scheduleTimeout fails, there is nothing to *promise*. Internally
    // Core would automatically set an exception result when Promise is
    // destructed before fulfilling.
    // This is either called from EventBase thread, or here.
    // They are somewhat racy but given the rare chance this could fail,
    // I don't see it is introducing any problem yet.
    auto promise = cob->stealPromise();
    if (!promise.isFulfilled()) {
      promise.setException(FutureNoTimekeeper{});
    }
  }
  return f;
}

namespace detail {

std::shared_ptr<Timekeeper> getTimekeeperSingleton() {
  return timekeeperSingleton_.try_get();
}

} // namespace detail

} // namespace folly
