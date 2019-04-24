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

#pragma once

#include <algorithm>
#include <atomic>
#include <chrono>

#include <folly/detail/Futex.h>
#include <folly/hash/Hash.h>
#include <folly/synchronization/AtomicStruct.h>
#include <folly/system/ThreadId.h>

namespace folly {
namespace detail {

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
  template <typename IdleTime = std::chrono::steady_clock::duration>
  static IdleTime getVariationTimeout(
      IdleTime const& idleTimeout =
          defaultIdleTimeout.load(std::memory_order_acquire),
      float timeoutVariationFrac = 0.5) {
    if (idleTimeout <= IdleTime::zero() || timeoutVariationFrac <= 0) {
      return idleTimeout;
    }

    // hash the pthread_t and the time to get the adjustment
    // Standard hash func isn't very good, so bit mix the result
    uint64_t h = folly::hash::twang_mix64(folly::hash::hash_combine(
        getCurrentThreadID(),
        std::chrono::system_clock::now().time_since_epoch().count()));

    // multiplying the duration by a floating point doesn't work, grr
    auto extraFrac = timeoutVariationFrac /
        static_cast<float>(std::numeric_limits<uint64_t>::max()) * h;
    auto tics = uint64_t(idleTimeout.count() * (1 + extraFrac));
    return IdleTime(tics);
  }

  /// Equivalent to fut.futexWait(expected, waitMask), but calls
  /// flushLocalMallocCaches() and unmapUnusedStack(stackToRetain)
  /// after idleTimeout has passed (if it has passed). Internally uses
  /// fut.futexWait and fut.futexWaitUntil. The actual timeout will be
  /// pseudo-randomly chosen to be between idleTimeout and idleTimeout *
  /// (1 + timeoutVariationFraction), to smooth out the behavior in a
  /// system with bursty requests. The default is to wait up to 50%
  /// extra, so on average 25% extra.
  template <
      typename Futex,
      typename IdleTime = std::chrono::steady_clock::duration>
  static FutexResult futexWait(
      Futex& fut,
      uint32_t expected,
      uint32_t waitMask = -1,
      IdleTime const& idleTimeout =
          defaultIdleTimeout.load(std::memory_order_acquire),
      size_t stackToRetain = kDefaultStackToRetain,
      float timeoutVariationFrac = 0.5) {
    FutexResult pre;
    if (futexWaitPreIdle(
            pre,
            fut,
            expected,
            std::chrono::steady_clock::time_point::max(),
            waitMask,
            idleTimeout,
            stackToRetain,
            timeoutVariationFrac)) {
      return pre;
    }

    using folly::detail::futexWait;
    return futexWait(&fut, expected, waitMask);
  }

  /// Equivalent to fut.futexWaitUntil(expected, deadline, waitMask), but
  /// calls flushLocalMallocCaches() and unmapUnusedStack(stackToRetain)
  /// after idleTimeout has passed (if it has passed). Internally uses
  /// fut.futexWaitUntil. The actual timeout will be pseudo-randomly
  /// chosen to be between idleTimeout and idleTimeout *
  /// (1 + timeoutVariationFraction), to smooth out the behavior in a
  /// system with bursty requests. The default is to wait up to 50%
  /// extra, so on average 25% extra.
  template <
      typename Futex,
      typename Deadline,
      typename IdleTime = std::chrono::steady_clock::duration>
  static FutexResult futexWaitUntil(
      Futex& fut,
      uint32_t expected,
      Deadline const& deadline,
      uint32_t waitMask = -1,
      IdleTime const& idleTimeout =
          defaultIdleTimeout.load(std::memory_order_acquire),
      size_t stackToRetain = kDefaultStackToRetain,
      float timeoutVariationFrac = 0.5) {
    FutexResult pre;
    if (futexWaitPreIdle(
            pre,
            fut,
            expected,
            deadline,
            waitMask,
            idleTimeout,
            stackToRetain,
            timeoutVariationFrac)) {
      return pre;
    }

    using folly::detail::futexWaitUntil;
    return futexWaitUntil(&fut, expected, deadline, waitMask);
  }

 private:
  template <typename Futex, typename Deadline, typename IdleTime>
  static bool futexWaitPreIdle(
      FutexResult& _ret,
      Futex& fut,
      uint32_t expected,
      Deadline const& deadline,
      uint32_t waitMask,
      IdleTime idleTimeout,
      size_t stackToRetain,
      float timeoutVariationFrac) {
    // idleTimeout < 0 means no flush behavior
    if (idleTimeout < IdleTime::zero()) {
      return false;
    }

    // idleTimeout == 0 means flush immediately, without variation
    // idleTimeout > 0 means flush after delay, with variation
    if (idleTimeout > IdleTime::zero()) {
      idleTimeout = std::max(
          IdleTime::zero(),
          getVariationTimeout(idleTimeout, timeoutVariationFrac));
    }
    if (idleTimeout > IdleTime::zero()) {
      auto idleDeadline = Deadline::clock::now() + idleTimeout;
      if (idleDeadline < deadline) {
        using folly::detail::futexWaitUntil;
        auto rv = futexWaitUntil(&fut, expected, idleDeadline, waitMask);
        if (rv != FutexResult::TIMEDOUT) {
          // finished before timeout hit, no flush
          _ret = rv;
          return true;
        }
      }
    }

    // flush, then wait
    flushLocalMallocCaches();
    unmapUnusedStack(stackToRetain);
    return false;
  }
};

} // namespace detail
} // namespace folly
