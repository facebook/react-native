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

#pragma once

#include <atomic>
#include <chrono>
#include <folly/AtomicStruct.h>
#include <folly/Hash.h>
#include <folly/Traits.h>
#include <folly/detail/Futex.h>
#include <folly/portability/PThread.h>

namespace folly {

// gcc 4.7 doesn't do std::is_trivial correctly, override so we can use
// AtomicStruct<duration>
template<>
struct IsTriviallyCopyable<std::chrono::steady_clock::duration>
  : std::true_type {};

}

namespace folly { namespace detail {

/// MemoryIdler provides helper routines that allow routines to return
/// some assigned memory resources back to the system.  The intended
/// use is that when a thread is waiting for a long time (perhaps it
/// is in a LIFO thread pool and hasn't been needed for a long time)
/// it should release its thread-local malloc caches (both jemalloc and
/// tcmalloc use these for better performance) and unmap the stack pages
/// that contain no useful data.
struct MemoryIdler {

  /// Returns memory from thread-local allocation pools to the global
  /// pool, if we know how to for the current malloc implementation.
  /// jemalloc is supported.
  static void flushLocalMallocCaches();


  enum {
    /// This value is a tradeoff between reclaiming memory and triggering
    /// a page fault immediately on wakeup.  Note that the actual unit
    /// of idling for the stack is pages, so the actual stack that
    /// will be available on wakeup without a page fault is between
    /// kDefaultStackToRetain and kDefaultStackToRetain + PageSize -
    /// 1 bytes.
    kDefaultStackToRetain = 1024,
  };

  /// Uses madvise to discard the portion of the thread's stack that
  /// currently doesn't hold any data, trying to ensure that no page
  /// faults will occur during the next retain bytes of stack allocation
  static void unmapUnusedStack(size_t retain = kDefaultStackToRetain);


  /// The system-wide default for the amount of time a blocking
  /// thread should wait before reclaiming idle memory.  Set this to
  /// Duration::max() to never wait.  The default value is 5 seconds.
  /// Endpoints using this idle timeout might randomly wait longer to
  /// avoid synchronizing their flushes.
  static AtomicStruct<std::chrono::steady_clock::duration> defaultIdleTimeout;

  /// Selects a timeout pseudo-randomly chosen to be between
  /// idleTimeout and idleTimeout * (1 + timeoutVariationFraction), to
  /// smooth out the behavior in a bursty system
  template <typename Clock = std::chrono::steady_clock>
  static typename Clock::duration getVariationTimeout(
      typename Clock::duration idleTimeout
          = defaultIdleTimeout.load(std::memory_order_acquire),
      float timeoutVariationFrac = 0.5) {
    if (idleTimeout.count() > 0 && timeoutVariationFrac > 0) {
      // hash the pthread_t and the time to get the adjustment.
      // Standard hash func isn't very good, so bit mix the result
      auto pr = std::make_pair(pthread_self(),
                               Clock::now().time_since_epoch().count());
      std::hash<decltype(pr)> hash_fn;
      uint64_t h = folly::hash::twang_mix64(hash_fn(pr));

      // multiplying the duration by a floating point doesn't work, grr..
      auto extraFrac =
        timeoutVariationFrac / std::numeric_limits<uint64_t>::max() * h;
      auto tics = uint64_t(idleTimeout.count() * (1 + extraFrac));
      idleTimeout = typename Clock::duration(tics);
    }

    return idleTimeout;
  }

  /// Equivalent to fut.futexWait(expected, waitMask), but calls
  /// flushLocalMallocCaches() and unmapUnusedStack(stackToRetain)
  /// after idleTimeout has passed (if it has passed).  Internally uses
  /// fut.futexWait and fut.futexWaitUntil.  Like futexWait, returns
  /// false if interrupted with a signal.  The actual timeout will be
  /// pseudo-randomly chosen to be between idleTimeout and idleTimeout *
  /// (1 + timeoutVariationFraction), to smooth out the behavior in a
  /// system with bursty requests.  The default is to wait up to 50%
  /// extra, so on average 25% extra
  template <template <typename> class Atom,
            typename Clock = std::chrono::steady_clock>
  static bool futexWait(
      Futex<Atom>& fut,
      uint32_t expected,
      uint32_t waitMask = -1,
      typename Clock::duration idleTimeout
          = defaultIdleTimeout.load(std::memory_order_acquire),
      size_t stackToRetain = kDefaultStackToRetain,
      float timeoutVariationFrac = 0.5) {

    if (idleTimeout == Clock::duration::max()) {
      // no need to use futexWaitUntil if no timeout is possible
      return fut.futexWait(expected, waitMask);
    }

    idleTimeout = getVariationTimeout(idleTimeout, timeoutVariationFrac);
    if (idleTimeout.count() > 0) {
      while (true) {
        auto rv = fut.futexWaitUntil(
          expected, Clock::now() + idleTimeout, waitMask);
        if (rv == FutexResult::TIMEDOUT) {
          // timeout is over
          break;
        }
        // finished before timeout hit, no flush
        assert(rv == FutexResult::VALUE_CHANGED || rv == FutexResult::AWOKEN ||
               rv == FutexResult::INTERRUPTED);
        return rv == FutexResult::AWOKEN;
      }
    }

    // flush, then wait with no timeout
    flushLocalMallocCaches();
    unmapUnusedStack(stackToRetain);
    return fut.futexWait(expected, waitMask);
  }
};

}} // namespace folly::detail
