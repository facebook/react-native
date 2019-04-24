/*
 * Copyright 2004-present Facebook, Inc.
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
#include <chrono>
#include <cstdint>

namespace folly {
namespace detail {
namespace distributed_mutex {

/**
 * DistributedMutex is a small, exclusive-only mutex that distributes the
 * bookkeeping required for mutual exclusion in the stacks of threads that are
 * contending for it.  It tries to come at a lower space cost than std::mutex
 * while still trying to maintain the fairness benefits that come from using
 * std::mutex.  DistributedMutex provides the entire API included in
 * std::mutex, and more, with slight modifications.  DistributedMutex is the
 * same width as a single pointer (8 bytes on most platforms), where on the
 * other hand, std::mutex and pthread_mutex_t are both 40 bytes.  It is larger
 * than some of the other smaller locks, but the wide majority of cases using
 * the small locks are wasting the difference in alignment padding anyway
 *
 * Benchmark results are good - at the time of writing in the common
 * uncontended case, it is 30% faster than some of the other small mutexes in
 * folly and as fast as std::mutex, which recently optimized its uncontended
 * path.  In the contended case, it is about 4-5x faster than some of the
 * smaller locks in folly, ~2x faster than std::mutex in clang and ~1.8x
 * faster in gcc.  DistributedMutex is also resistent to tail latency
 * pathalogies unlike many of the other small mutexes.  Which sleep for large
 * time quantums to reduce spin churn, this causes elevated latencies for
 * threads that enter the sleep cycle.  The tail latency of lock acquisition
 * on average up to 10x better with DistributedMutex
 *
 * DistributedMutex reduces cache line contention by making each thread wait
 * on a thread local spinlock and futex.  This allows threads to keep working
 * only on their own cache lines without requiring cache coherence operations
 * when a mutex heavy contention.  This strategy does not require sequential
 * ordering on the centralized atomic storage for wakeup operations as each
 * thread assigned its own wait state
 *
 * Non-timed mutex acquisitions are scheduled through intrusive LIFO
 * contention chains.  Each thread starts by spinning for a short quantum and
 * falls back to two phased sleeping.  Enqueue operations are lock free and
 * are piggybacked off mutex acquisition attempts.  The LIFO behavior of a
 * contention chain is good in the case where the mutex is held for a short
 * amount of time, as the head of the chain is likely to not have slept on
 * futex() after exhausting its spin quantum.  This allow us to avoid
 * unnecessary traversal and syscalls in the fast path with a higher
 * probability.  Even though the contention chains are LIFO, the mutex itself
 * does not adhere to that scheduling policy globally.  During contention,
 * threads that fail to lock the mutex form a LIFO chain on the central mutex
 * state, this chain is broken when a wakeup is scheduled, and future enqueue
 * operations form a new chain.  This makes the chains themselves LIFO, but
 * preserves global fairness through a constant factor which is limited to the
 * number of concurrent failed mutex acquisition attempts.  This binds the
 * last in first out behavior to the number of contending threads and helps
 * prevent starvation and latency outliers
 *
 * This strategy of waking up wakers one by one in a queue does not scale well
 * when the number of threads goes past the number of cores.  At which point
 * preemption causes elevated lock acquisition latencies.  DistributedMutex
 * implements a hardware timestamp publishing heuristic to detect and adapt to
 * preemption.
 *
 * DistributedMutex does not have the typical mutex API - it does not satisfy
 * the Lockable concept.  It requires the user to maintain ephemeral
 * bookkeeping and pass that bookkeeping around to unlock() calls.  The API
 * overhead, however, comes for free when you wrap this mutex for usage with
 * folly::Synchronized or std::unique_lock, which is the recommended usage
 * (std::lock_guard, in optimized mode, has no performance benefit over
 * std::unique_lock, so has been omitted).  A benefit of this API is that it
 * disallows incorrect usage where a thread unlocks a mutex that it does not
 * own, thinking a mutex is functionally identical to a binary semaphore,
 * which, unlike a mutex, is a suitable primitive for that usage
 *
 * Timed locking through DistributedMutex is implemented through a centralized
 * algorithm - all waiters wait on the central mutex state, by setting and
 * resetting bits within the pointer-length word.  Since pointer length atomic
 * integers are incompatible with futex(FUTEX_WAIT) on most systems, a
 * non-standard implementation of futex() is used, where wait queues are
 * managed in user-space.  See p1135r0 and folly::ParkingLot
 */
template <
    template <typename> class Atomic = std::atomic,
    bool TimePublishing = true>
class DistributedMutex {
 public:
  class DistributedMutexStateProxy;

  /**
   * DistributedMutex is only default constructible, it can neither be moved
   * nor copied
   */
  DistributedMutex();
  DistributedMutex(DistributedMutex&&) = delete;
  DistributedMutex(const DistributedMutex&) = delete;
  DistributedMutex& operator=(DistributedMutex&&) = delete;
  DistributedMutex& operator=(const DistributedMutex&) = delete;

  /**
   * Acquires the mutex in exclusive mode
   *
   * This returns an ephemeral proxy that contains internal mutex state.  This
   * must be kept around for the duration of the critical section and passed
   * subsequently to unlock() as an rvalue
   *
   * The proxy has no public API and is intended to be for internal usage only
   *
   * This is not a recursive mutex - trying to acquire the mutex twice from
   * the same thread without unlocking it results in undefined behavior
   */
  DistributedMutexStateProxy lock();

  /**
   * Unlocks the mutex
   *
   * The proxy returned by lock must be passed to unlock as an rvalue.  No
   * other option is possible here, since the proxy is only movable and not
   * copyable
   */
  void unlock(DistributedMutexStateProxy);

  /**
   * Try to acquire the mutex
   *
   * A non blocking version of the lock() function.  The returned object is
   * contextually convertible to bool.  And has the value true when the mutex
   * was successfully acquired, false otherwise
   *
   * This is allowed to return false spuriously, i.e. this is not guaranteed
   * to return true even when the mutex is currently unlocked.  In the event
   * of a failed acquisition, this does not impose any memory ordering
   * constraints for other threads
   */
  DistributedMutexStateProxy try_lock();

  /**
   * Try to acquire the mutex, blocking for the given time
   *
   * Like try_lock(), this is allowed to fail spuriously and is not guaranteed
   * to return false even when the mutex is currently unlocked.  But only
   * after the given time has elapsed
   *
   * try_lock_for() accepts a duration to block for, and try_lock_until()
   * accepts an absolute wall clock time point
   */
  template <typename Rep, typename Period>
  DistributedMutexStateProxy try_lock_for(
      const std::chrono::duration<Rep, Period>& duration);

  /**
   * Try to acquire the lock, blocking until the given deadline
   *
   * Other than the difference in the meaning of the second argument, the
   * semantics of this function are identical to try_lock_for()
   */
  template <typename Clock, typename Duration>
  DistributedMutexStateProxy try_lock_until(
      const std::chrono::time_point<Clock, Duration>& deadline);

 private:
  Atomic<std::uintptr_t> state_{0};
};

} // namespace distributed_mutex
} // namespace detail

/**
 * Bring the default instantiation of DistributedMutex into the folly
 * namespace without requiring any template arguments for public usage
 */
using DistributedMutex = detail::distributed_mutex::DistributedMutex<>;

} // namespace folly

#include <folly/synchronization/DistributedMutex-inl.h>
