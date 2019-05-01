/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/Portability.h>

#if FOLLY_HAS_COROUTINES

#include <folly/experimental/coro/Mutex.h>

#include <cassert>

using namespace folly::coro;

Mutex::~Mutex() {
  // Check there are no waiters waiting to acquire the lock.
  assert(
      state_.load(std::memory_order_relaxed) == unlockedState() ||
      state_.load(std::memory_order_relaxed) == nullptr);
  assert(waiters_ == nullptr);
}

void Mutex::unlock() noexcept {
  assert(state_.load(std::memory_order_relaxed) != unlockedState());

  auto* waitersHead = waiters_;
  if (waitersHead == nullptr) {
    void* currentState = state_.load(std::memory_order_relaxed);
    if (currentState == nullptr) {
      // Looks like there are no waiters waiting to acquire the lock.
      // Try to unlock it - use a compare-exchange to decide the race between
      // unlocking the mutex and another thread enqueueing another waiter.
      const bool releasedLock = state_.compare_exchange_strong(
          currentState,
          unlockedState(),
          std::memory_order_release,
          std::memory_order_relaxed);
      if (releasedLock) {
        return;
      }
    }

    // There are some awaiters that have been newly queued.
    // Dequeue them and reverse their order from LIFO to FIFO.
    currentState = state_.exchange(nullptr, std::memory_order_acquire);

    assert(currentState != unlockedState());
    assert(currentState != nullptr);

    auto* waiter = static_cast<LockOperation*>(currentState);
    do {
      auto* temp = waiter->next_;
      waiter->next_ = waitersHead;
      waitersHead = waiter;
      waiter = temp;
    } while (waiter != nullptr);
  }

  assert(waitersHead != nullptr);

  waiters_ = waitersHead->next_;

  waitersHead->awaitingCoroutine_.resume();
}

bool Mutex::lockAsyncImpl(LockOperation* awaiter) {
  void* oldValue = state_.load(std::memory_order_relaxed);
  while (true) {
    if (oldValue == unlockedState()) {
      // It looks like the mutex is currently unlocked.
      // Try to acquire it synchronously.
      void* newValue = nullptr;
      if (state_.compare_exchange_weak(
              oldValue,
              newValue,
              std::memory_order_acquire,
              std::memory_order_relaxed)) {
        // Acquired synchronously, don't suspend.
        return false;
      }
    } else {
      // It looks like the mutex is currently locked.
      // Try to queue this waiter to the list of waiters.
      void* newValue = awaiter;
      awaiter->next_ = static_cast<LockOperation*>(oldValue);
      if (state_.compare_exchange_weak(
              oldValue,
              newValue,
              std::memory_order_release,
              std::memory_order_relaxed)) {
        // Queued waiter successfully. Awaiting coroutine should suspend.
        return true;
      }
    }
  }
}

#endif
