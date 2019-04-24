/*
 * Copyright 2012-present Facebook, Inc.
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

#include <atomic>
#include <climits>
#include <thread>

#include <glog/logging.h>

#include <folly/Likely.h>
#include <folly/detail/Futex.h>
#include <folly/lang/Bits.h>
#include <folly/portability/SysTime.h>
#include <folly/portability/Unistd.h>

namespace folly {

/**
 * Event count: a condition variable for lock free algorithms.
 *
 * See http://www.1024cores.net/home/lock-free-algorithms/eventcounts for
 * details.
 *
 * Event counts allow you to convert a non-blocking lock-free / wait-free
 * algorithm into a blocking one, by isolating the blocking logic.  You call
 * prepareWait() before checking your condition and then either cancelWait()
 * or wait() depending on whether the condition was true.  When another
 * thread makes the condition true, it must call notify() / notifyAll() just
 * like a regular condition variable.
 *
 * If "<" denotes the happens-before relationship, consider 2 threads (T1 and
 * T2) and 3 events:
 * - E1: T1 returns from prepareWait
 * - E2: T1 calls wait
 *   (obviously E1 < E2, intra-thread)
 * - E3: T2 calls notifyAll
 *
 * If E1 < E3, then E2's wait will complete (and T1 will either wake up,
 * or not block at all)
 *
 * This means that you can use an EventCount in the following manner:
 *
 * Waiter:
 *   if (!condition()) {  // handle fast path first
 *     for (;;) {
 *       auto key = eventCount.prepareWait();
 *       if (condition()) {
 *         eventCount.cancelWait();
 *         break;
 *       } else {
 *         eventCount.wait(key);
 *       }
 *     }
 *  }
 *
 *  (This pattern is encapsulated in await())
 *
 * Poster:
 *   make_condition_true();
 *   eventCount.notifyAll();
 *
 * Note that, just like with regular condition variables, the waiter needs to
 * be tolerant of spurious wakeups and needs to recheck the condition after
 * being woken up.  Also, as there is no mutual exclusion implied, "checking"
 * the condition likely means attempting an operation on an underlying
 * data structure (push into a lock-free queue, etc) and returning true on
 * success and false on failure.
 */
class EventCount {
 public:
  EventCount() noexcept : val_(0) {}

  class Key {
    friend class EventCount;
    explicit Key(uint32_t e) noexcept : epoch_(e) {}
    uint32_t epoch_;
  };

  void notify() noexcept;
  void notifyAll() noexcept;
  Key prepareWait() noexcept;
  void cancelWait() noexcept;
  void wait(Key key) noexcept;

  /**
   * Wait for condition() to become true.  Will clean up appropriately if
   * condition() throws, and then rethrow.
   */
  template <class Condition>
  void await(Condition condition);

 private:
  void doNotify(int n) noexcept;
  EventCount(const EventCount&) = delete;
  EventCount(EventCount&&) = delete;
  EventCount& operator=(const EventCount&) = delete;
  EventCount& operator=(EventCount&&) = delete;

  // This requires 64-bit
  static_assert(sizeof(int) == 4, "bad platform");
  static_assert(sizeof(uint32_t) == 4, "bad platform");
  static_assert(sizeof(uint64_t) == 8, "bad platform");
  static_assert(sizeof(std::atomic<uint64_t>) == 8, "bad platform");
  static_assert(sizeof(detail::Futex<std::atomic>) == 4, "bad platform");

  static constexpr size_t kEpochOffset = kIsLittleEndian ? 1 : 0;

  // val_ stores the epoch in the most significant 32 bits and the
  // waiter count in the least significant 32 bits.
  std::atomic<uint64_t> val_;

  static constexpr uint64_t kAddWaiter = uint64_t(1);
  static constexpr uint64_t kSubWaiter = uint64_t(-1);
  static constexpr size_t kEpochShift = 32;
  static constexpr uint64_t kAddEpoch = uint64_t(1) << kEpochShift;
  static constexpr uint64_t kWaiterMask = kAddEpoch - 1;
};

inline void EventCount::notify() noexcept {
  doNotify(1);
}

inline void EventCount::notifyAll() noexcept {
  doNotify(INT_MAX);
}

inline void EventCount::doNotify(int n) noexcept {
  uint64_t prev = val_.fetch_add(kAddEpoch, std::memory_order_acq_rel);
  if (UNLIKELY(prev & kWaiterMask)) {
    detail::futexWake(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset, n);
  }
}

inline EventCount::Key EventCount::prepareWait() noexcept {
  uint64_t prev = val_.fetch_add(kAddWaiter, std::memory_order_acq_rel);
  return Key(prev >> kEpochShift);
}

inline void EventCount::cancelWait() noexcept {
  // memory_order_relaxed would suffice for correctness, but the faster
  // #waiters gets to 0, the less likely it is that we'll do spurious wakeups
  // (and thus system calls).
  uint64_t prev = val_.fetch_add(kSubWaiter, std::memory_order_seq_cst);
  DCHECK_NE((prev & kWaiterMask), 0);
}

inline void EventCount::wait(Key key) noexcept {
  while ((val_.load(std::memory_order_acquire) >> kEpochShift) == key.epoch_) {
    detail::futexWait(
        reinterpret_cast<detail::Futex<std::atomic>*>(&val_) + kEpochOffset,
        key.epoch_);
  }
  // memory_order_relaxed would suffice for correctness, but the faster
  // #waiters gets to 0, the less likely it is that we'll do spurious wakeups
  // (and thus system calls)
  uint64_t prev = val_.fetch_add(kSubWaiter, std::memory_order_seq_cst);
  DCHECK_NE((prev & kWaiterMask), 0);
}

template <class Condition>
void EventCount::await(Condition condition) {
  if (condition()) {
    return; // fast path
  }

  // condition() is the only thing that may throw, everything else is
  // noexcept, so we can hoist the try/catch block outside of the loop
  try {
    for (;;) {
      auto key = prepareWait();
      if (condition()) {
        cancelWait();
        break;
      } else {
        wait(key);
      }
    }
  } catch (...) {
    cancelWait();
    throw;
  }
}

} // namespace folly
