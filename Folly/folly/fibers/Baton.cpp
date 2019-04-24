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
#include <folly/fibers/Baton.h>

#include <chrono>

#include <folly/detail/MemoryIdler.h>
#include <folly/fibers/FiberManagerInternal.h>
#include <folly/portability/Asm.h>

namespace folly {
namespace fibers {

using folly::detail::futexWaitUntil;
using folly::detail::futexWake;

void Baton::setWaiter(Waiter& waiter) {
  auto curr_waiter = waiter_.load();
  do {
    if (LIKELY(curr_waiter == NO_WAITER)) {
      continue;
    } else if (curr_waiter == POSTED || curr_waiter == TIMEOUT) {
      waiter.post();
      break;
    } else {
      throw std::logic_error("Some waiter is already waiting on this Baton.");
    }
  } while (!waiter_.compare_exchange_weak(
      curr_waiter, reinterpret_cast<intptr_t>(&waiter)));
}

void Baton::wait() {
  wait([]() {});
}

void Baton::wait(TimeoutHandler& timeoutHandler) {
  auto timeoutFunc = [this, &timeoutHandler] {
    if (!try_wait()) {
      postHelper(TIMEOUT);
    }
    timeoutHandler.timeoutPtr_ = 0;
  };
  timeoutHandler.timeoutFunc_ = std::ref(timeoutFunc);
  timeoutHandler.fiberManager_ = FiberManager::getFiberManagerUnsafe();
  wait();
  timeoutHandler.cancelTimeout();
}

void Baton::waitThread() {
  if (spinWaitForEarlyPost()) {
    assert(waiter_.load(std::memory_order_acquire) == POSTED);
    return;
  }

  auto waiter = waiter_.load();

  if (LIKELY(
          waiter == NO_WAITER &&
          waiter_.compare_exchange_strong(waiter, THREAD_WAITING))) {
    do {
      folly::detail::MemoryIdler::futexWait(
          futex_.futex, uint32_t(THREAD_WAITING));
      waiter = waiter_.load(std::memory_order_acquire);
    } while (waiter == THREAD_WAITING);
  }

  if (LIKELY(waiter == POSTED)) {
    return;
  }

  // Handle errors
  if (waiter == TIMEOUT) {
    throw std::logic_error("Thread baton can't have timeout status");
  }
  if (waiter == THREAD_WAITING) {
    throw std::logic_error("Other thread is already waiting on this baton");
  }
  throw std::logic_error("Other waiter is already waiting on this baton");
}

bool Baton::spinWaitForEarlyPost() {
  static_assert(
      PreBlockAttempts > 0,
      "isn't this assert clearer than an uninitialized variable warning?");
  for (int i = 0; i < PreBlockAttempts; ++i) {
    if (try_wait()) {
      // hooray!
      return true;
    }
    // The pause instruction is the polite way to spin, but it doesn't
    // actually affect correctness to omit it if we don't have it.
    // Pausing donates the full capabilities of the current core to
    // its other hyperthreads for a dozen cycles or so
    asm_volatile_pause();
  }

  return false;
}

bool Baton::timedWaitThread(TimeoutController::Duration timeout) {
  if (spinWaitForEarlyPost()) {
    assert(waiter_.load(std::memory_order_acquire) == POSTED);
    return true;
  }

  auto waiter = waiter_.load();

  if (LIKELY(
          waiter == NO_WAITER &&
          waiter_.compare_exchange_strong(waiter, THREAD_WAITING))) {
    auto deadline = TimeoutController::Clock::now() + timeout;
    do {
      auto* futex = &futex_.futex;
      const auto wait_rv =
          futexWaitUntil(futex, uint32_t(THREAD_WAITING), deadline);
      if (wait_rv == folly::detail::FutexResult::TIMEDOUT) {
        return false;
      }
      waiter = waiter_.load(std::memory_order_relaxed);
    } while (waiter == THREAD_WAITING);
  }

  if (LIKELY(waiter == POSTED)) {
    return true;
  }

  // Handle errors
  if (waiter == TIMEOUT) {
    throw std::logic_error("Thread baton can't have timeout status");
  }
  if (waiter == THREAD_WAITING) {
    throw std::logic_error("Other thread is already waiting on this baton");
  }
  throw std::logic_error("Other waiter is already waiting on this baton");
}

void Baton::post() {
  postHelper(POSTED);
}

void Baton::postHelper(intptr_t new_value) {
  auto waiter = waiter_.load();

  do {
    if (waiter == THREAD_WAITING) {
      assert(new_value == POSTED);

      return postThread();
    }

    if (waiter == POSTED || waiter == TIMEOUT) {
      return;
    }
  } while (!waiter_.compare_exchange_weak(waiter, new_value));

  if (waiter != NO_WAITER) {
    reinterpret_cast<Waiter*>(waiter)->post();
  }
}

bool Baton::try_wait() {
  return ready();
}

void Baton::postThread() {
  auto expected = THREAD_WAITING;

  auto* futex = &futex_.futex;
  if (!waiter_.compare_exchange_strong(expected, POSTED)) {
    return;
  }
  futexWake(futex, 1);
}

void Baton::reset() {
  waiter_.store(NO_WAITER, std::memory_order_relaxed);
}

void Baton::TimeoutHandler::scheduleTimeout(
    TimeoutController::Duration timeout) {
  assert(fiberManager_ != nullptr);
  assert(timeoutFunc_ != nullptr);
  assert(timeoutPtr_ == 0);

  if (timeout.count() > 0) {
    timeoutPtr_ =
        fiberManager_->timeoutManager_->registerTimeout(timeoutFunc_, timeout);
  }
}

void Baton::TimeoutHandler::cancelTimeout() {
  if (timeoutPtr_) {
    fiberManager_->timeoutManager_->cancel(timeoutPtr_);
  }
}
} // namespace fibers
} // namespace folly
