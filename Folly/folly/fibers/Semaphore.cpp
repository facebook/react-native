/*
 * Copyright 2017 Facebook, Inc.
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
#include "Semaphore.h"

namespace folly {
namespace fibers {

bool Semaphore::signalSlow() {
  // If we signalled a release, notify the waitlist
  SYNCHRONIZED(waitList_) {
    auto testVal = tokens_.load(std::memory_order_acquire);
    if (testVal != 0) {
      return false;
    }

    if (waitList_.empty()) {
      // If the waitlist is now empty, ensure the token count increments
      // No need for CAS here as we will always be under the mutex
      CHECK(tokens_.compare_exchange_strong(
          testVal, testVal + 1, std::memory_order_relaxed));
    } else {
      // trigger waiter if there is one
      waitList_.front()->post();
      waitList_.pop();
    }
  } // SYNCHRONIZED(waitList_)
  return true;
}

void Semaphore::signal() {
  auto oldVal = tokens_.load(std::memory_order_acquire);
  do {
    if (oldVal == 0) {
      if (signalSlow()) {
        break;
      }
    }
  } while (!tokens_.compare_exchange_weak(
      oldVal,
      oldVal + 1,
      std::memory_order_release,
      std::memory_order_acquire));
}

bool Semaphore::waitSlow() {
  // Slow path, create a baton and acquire a mutex to update the wait list
  folly::fibers::Baton waitBaton;

  SYNCHRONIZED(waitList_) {
    auto testVal = tokens_.load(std::memory_order_acquire);
    if (testVal != 0) {
      return false;
    }
    // prepare baton and add to queue
    waitList_.push(&waitBaton);
  }
  // If we managed to create a baton, wait on it
  // This has to be done here so the mutex has been released
  waitBaton.wait();
  return true;
}

void Semaphore::wait() {
  auto oldVal = tokens_.load(std::memory_order_acquire);
  do {
    if (oldVal == 0) {
      // If waitSlow fails it is because the token is non-zero by the time
      // the lock is taken, so we can just continue round the loop
      if (waitSlow()) {
        break;
      }
    }
  } while (!tokens_.compare_exchange_weak(
      oldVal,
      oldVal - 1,
      std::memory_order_release,
      std::memory_order_acquire));
}

size_t Semaphore::getCapacity() const {
  return capacity_;
}

} // namespace fibers
} // namespace folly
