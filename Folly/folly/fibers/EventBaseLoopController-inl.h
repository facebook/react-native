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
#include <folly/Memory.h>
#include <folly/fibers/EventBaseLoopController.h>

namespace folly {
namespace fibers {

inline EventBaseLoopController::EventBaseLoopController() : callback_(*this) {}

inline EventBaseLoopController::~EventBaseLoopController() {
  callback_.cancelLoopCallback();
  eventBaseKeepAlive_.reset();
}

inline void EventBaseLoopController::attachEventBase(EventBase& eventBase) {
  attachEventBase(eventBase.getVirtualEventBase());
}

inline void EventBaseLoopController::attachEventBase(
    VirtualEventBase& eventBase) {
  if (eventBase_ != nullptr) {
    LOG(ERROR) << "Attempt to reattach EventBase to LoopController";
  }

  eventBase_ = &eventBase;
  eventBaseAttached_ = true;

  if (awaitingScheduling_) {
    schedule();
  }
}

inline void EventBaseLoopController::setFiberManager(FiberManager* fm) {
  fm_ = fm;
}

inline void EventBaseLoopController::schedule() {
  if (eventBase_ == nullptr) {
    // In this case we need to postpone scheduling.
    awaitingScheduling_ = true;
  } else {
    // Schedule it to run in current iteration.

    if (!eventBaseKeepAlive_) {
      eventBaseKeepAlive_ = getKeepAliveToken(eventBase_);
    }
    eventBase_->getEventBase().runInLoop(&callback_, true);
    awaitingScheduling_ = false;
  }
}

inline void EventBaseLoopController::runLoop() {
  if (!eventBaseKeepAlive_) {
    // runLoop can be called twice if both schedule() and scheduleThreadSafe()
    // were called.
    if (!fm_->hasTasks()) {
      return;
    }
    eventBaseKeepAlive_ = getKeepAliveToken(eventBase_);
  }
  if (loopRunner_) {
    if (fm_->hasReadyTasks()) {
      loopRunner_->run([&] { fm_->loopUntilNoReadyImpl(); });
    }
  } else {
    fm_->loopUntilNoReadyImpl();
  }
  if (!fm_->hasTasks()) {
    eventBaseKeepAlive_.reset();
  }
}

inline void EventBaseLoopController::scheduleThreadSafe() {
  /* The only way we could end up here is if
     1) Fiber thread creates a fiber that awaits (which means we must
        have already attached, fiber thread wouldn't be running).
     2) We move the promise to another thread (this move is a memory fence)
     3) We fulfill the promise from the other thread. */
  assert(eventBaseAttached_);

  eventBase_->runInEventBaseThread(
      [this, eventBaseKeepAlive = getKeepAliveToken(eventBase_)]() {
        if (fm_->shouldRunLoopRemote()) {
          return runLoop();
        }

        if (!fm_->hasTasks()) {
          eventBaseKeepAlive_.reset();
        }
      });
}

inline void EventBaseLoopController::timedSchedule(
    std::function<void()> func,
    TimePoint time) {
  assert(eventBaseAttached_);

  // We want upper bound for the cast, thus we just add 1
  auto delay_ms =
      std::chrono::duration_cast<std::chrono::milliseconds>(time - Clock::now())
          .count() +
      1;
  // If clock is not monotonic
  delay_ms = std::max<decltype(delay_ms)>(delay_ms, 0);
  eventBase_->tryRunAfterDelay(func, uint32_t(delay_ms));
}
} // namespace fibers
} // namespace folly
