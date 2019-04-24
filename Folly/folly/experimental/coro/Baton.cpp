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

#include <folly/experimental/coro/Baton.h>

#include <cassert>

using namespace folly::coro;

Baton::~Baton() {
  // Should not be any waiting coroutines when the baton is destruced.
  // Caller should ensure the baton is posted before destructing.
  assert(
      state_.load(std::memory_order_relaxed) == static_cast<void*>(this) ||
      state_.load(std::memory_order_relaxed) == nullptr);
}

void Baton::post() noexcept {
  void* signalledState = static_cast<void*>(this);
  void* oldValue = state_.exchange(signalledState, std::memory_order_acq_rel);
  if (oldValue != signalledState && oldValue != nullptr) {
    // We are the first thread to set the state to signalled and there is
    // a waiting coroutine. We are responsible for resuming it.
    WaitOperation* awaiter = static_cast<WaitOperation*>(oldValue);
    awaiter->awaitingCoroutine_.resume();
  }
}

bool Baton::waitImpl(WaitOperation* awaiter) const noexcept {
  void* oldValue = nullptr;
  if (!state_.compare_exchange_strong(
          oldValue,
          static_cast<void*>(awaiter),
          std::memory_order_release,
          std::memory_order_acquire)) {
    // If the compare-exchange fails it should be because the baton was
    // set to the signalled state. If this not the case then this could
    // indicate that there are two awaiting coroutines.
    assert(oldValue == static_cast<const void*>(this));
    return false;
  }
  return true;
}

#endif // FOLLY_HAS_COROUTINES
