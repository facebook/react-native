/*
 * Copyright 2015-present Facebook, Inc.
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

// @author Nathan Bronson (ngbronson@fb.com)

#pragma once

#include <stdint.h>

#include <atomic>
#include <thread>
#include <type_traits>

#include <folly/CPortability.h>
#include <folly/Likely.h>
#include <folly/concurrency/CacheLocality.h>
#include <folly/detail/Futex.h>
#include <folly/portability/Asm.h>
#include <folly/portability/SysResource.h>
#include <folly/synchronization/SanitizeThread.h>

// SharedMutex is a reader-writer lock.  It is small, very fast, scalable
// on multi-core, and suitable for use when readers or writers may block.
// Unlike most other reader-writer locks, its throughput with concurrent
// readers scales linearly; it is able to acquire and release the lock
// in shared mode without cache line ping-ponging.  It is suitable for
// a wide range of lock hold times because it starts with spinning,
// proceeds to using sched_yield with a preemption heuristic, and then
// waits using futex and precise wakeups.
//
// SharedMutex provides all of the methods of folly::RWSpinLock,
// boost::shared_mutex, boost::upgrade_mutex, and C++14's
// std::shared_timed_mutex.  All operations that can block are available
// in try, try-for, and try-until (system_clock or steady_clock) versions.
//
// SharedMutexReadPriority gives priority to readers,
// SharedMutexWritePriority gives priority to writers.  SharedMutex is an
// alias for SharedMutexWritePriority, because writer starvation is more
// likely than reader starvation for the read-heavy workloads targetted
// by SharedMutex.
//
// In my tests SharedMutex is as good or better than the other
// reader-writer locks in use at Facebook for almost all use cases,
// sometimes by a wide margin.  (If it is rare that there are actually
// concurrent readers then RWSpinLock can be a few nanoseconds faster.)
// I compared it to folly::RWSpinLock, folly::RWTicketSpinLock64,
// boost::shared_mutex, pthread_rwlock_t, and a RWLock that internally uses
// spinlocks to guard state and pthread_mutex_t+pthread_cond_t to block.
// (Thrift's ReadWriteMutex is based underneath on pthread_rwlock_t.)
// It is generally as good or better than the rest when evaluating size,
// speed, scalability, or latency outliers.  In the corner cases where
// it is not the fastest (such as single-threaded use or heavy write
// contention) it is never very much worse than the best.  See the bottom
// of folly/test/SharedMutexTest.cpp for lots of microbenchmark results.
//
// Comparison to folly::RWSpinLock:
//
//  * SharedMutex is faster than RWSpinLock when there are actually
//    concurrent read accesses (sometimes much faster), and ~5 nanoseconds
//    slower when there is not actually any contention.  SharedMutex is
//    faster in every (benchmarked) scenario where the shared mode of
//    the lock is actually useful.
//
//  * Concurrent shared access to SharedMutex scales linearly, while total
//    RWSpinLock throughput drops as more threads try to access the lock
//    in shared mode.  Under very heavy read contention SharedMutex can
//    be two orders of magnitude faster than RWSpinLock (or any reader
//    writer lock that doesn't use striping or deferral).
//
//  * SharedMutex can safely protect blocking calls, because after an
//    initial period of spinning it waits using futex().
//
//  * RWSpinLock prioritizes readers, SharedMutex has both reader- and
//    writer-priority variants, but defaults to write priority.
//
//  * RWSpinLock's upgradeable mode blocks new readers, while SharedMutex's
//    doesn't.  Both semantics are reasonable.  The boost documentation
//    doesn't explicitly talk about this behavior (except by omitting
//    any statement that those lock modes conflict), but the boost
//    implementations do allow new readers while the upgradeable mode
//    is held.  See https://github.com/boostorg/thread/blob/master/
//      include/boost/thread/pthread/shared_mutex.hpp
//
//  * RWSpinLock::UpgradedHolder maps to SharedMutex::UpgradeHolder
//    (UpgradeableHolder would be even more pedantically correct).
//    SharedMutex's holders have fewer methods (no reset) and are less
//    tolerant (promotion and downgrade crash if the donor doesn't own
//    the lock, and you must use the default constructor rather than
//    passing a nullptr to the pointer constructor).
//
// Both SharedMutex and RWSpinLock provide "exclusive", "upgrade",
// and "shared" modes.  At all times num_threads_holding_exclusive +
// num_threads_holding_upgrade <= 1, and num_threads_holding_exclusive ==
// 0 || num_threads_holding_shared == 0.  RWSpinLock has the additional
// constraint that num_threads_holding_shared cannot increase while
// num_threads_holding_upgrade is non-zero.
//
// Comparison to the internal RWLock:
//
//  * SharedMutex doesn't allow a maximum reader count to be configured,
//    so it can't be used as a semaphore in the same way as RWLock.
//
//  * SharedMutex is 4 bytes, RWLock is 256.
//
//  * SharedMutex is as fast or faster than RWLock in all of my
//    microbenchmarks, and has positive rather than negative scalability.
//
//  * RWLock and SharedMutex are both writer priority locks.
//
//  * SharedMutex avoids latency outliers as well as RWLock.
//
//  * SharedMutex uses different names (t != 0 below):
//
//    RWLock::lock(0)    => SharedMutex::lock()
//
//    RWLock::lock(t)    => SharedMutex::try_lock_for(milliseconds(t))
//
//    RWLock::tryLock()  => SharedMutex::try_lock()
//
//    RWLock::unlock()   => SharedMutex::unlock()
//
//    RWLock::enter(0)   => SharedMutex::lock_shared()
//
//    RWLock::enter(t)   =>
//        SharedMutex::try_lock_shared_for(milliseconds(t))
//
//    RWLock::tryEnter() => SharedMutex::try_lock_shared()
//
//    RWLock::leave()    => SharedMutex::unlock_shared()
//
//  * RWLock allows the reader count to be adjusted by a value other
//    than 1 during enter() or leave(). SharedMutex doesn't currently
//    implement this feature.
//
//  * RWLock's methods are marked const, SharedMutex's aren't.
//
// Reader-writer locks have the potential to allow concurrent access
// to shared read-mostly data, but in practice they often provide no
// improvement over a mutex.  The problem is the cache coherence protocol
// of modern CPUs.  Coherence is provided by making sure that when a cache
// line is written it is present in only one core's cache.  Since a memory
// write is required to acquire a reader-writer lock in shared mode, the
// cache line holding the lock is invalidated in all of the other caches.
// This leads to cache misses when another thread wants to acquire or
// release the lock concurrently.  When the RWLock is colocated with the
// data it protects (common), cache misses can also continue occur when
// a thread that already holds the lock tries to read the protected data.
//
// Ideally, a reader-writer lock would allow multiple cores to acquire
// and release the lock in shared mode without incurring any cache misses.
// This requires that each core records its shared access in a cache line
// that isn't read or written by other read-locking cores.  (Writers will
// have to check all of the cache lines.)  Typical server hardware when
// this comment was written has 16 L1 caches and cache lines of 64 bytes,
// so a lock striped over all L1 caches would occupy a prohibitive 1024
// bytes.  Nothing says that we need a separate set of per-core memory
// locations for each lock, however.  Each SharedMutex instance is only
// 4 bytes, but all locks together share a 2K area in which they make a
// core-local record of lock acquisitions.
//
// SharedMutex's strategy of using a shared set of core-local stripes has
// a potential downside, because it means that acquisition of any lock in
// write mode can conflict with acquisition of any lock in shared mode.
// If a lock instance doesn't actually experience concurrency then this
// downside will outweight the upside of improved scalability for readers.
// To avoid this problem we dynamically detect concurrent accesses to
// SharedMutex, and don't start using the deferred mode unless we actually
// observe concurrency.  See kNumSharedToStartDeferring.
//
// It is explicitly allowed to call unlock_shared() from a different
// thread than lock_shared(), so long as they are properly paired.
// unlock_shared() needs to find the location at which lock_shared()
// recorded the lock, which might be in the lock itself or in any of
// the shared slots.  If you can conveniently pass state from lock
// acquisition to release then the fastest mechanism is to std::move
// the SharedMutex::ReadHolder instance or an SharedMutex::Token (using
// lock_shared(Token&) and unlock_shared(Token&)).  The guard or token
// will tell unlock_shared where in deferredReaders[] to look for the
// deferred lock.  The Token-less version of unlock_shared() works in all
// cases, but is optimized for the common (no inter-thread handoff) case.
//
// In both read- and write-priority mode, a waiting lock() (exclusive mode)
// only blocks readers after it has waited for an active upgrade lock to be
// released; until the upgrade lock is released (or upgraded or downgraded)
// readers will still be able to enter.  Preferences about lock acquisition
// are not guaranteed to be enforced perfectly (even if they were, there
// is theoretically the chance that a thread could be arbitrarily suspended
// between calling lock() and SharedMutex code actually getting executed).
//
// try_*_for methods always try at least once, even if the duration
// is zero or negative.  The duration type must be compatible with
// std::chrono::steady_clock.  try_*_until methods also always try at
// least once.  std::chrono::system_clock and std::chrono::steady_clock
// are supported.
//
// If you have observed by profiling that your SharedMutex-s are getting
// cache misses on deferredReaders[] due to another SharedMutex user, then
// you can use the tag type to create your own instantiation of the type.
// The contention threshold (see kNumSharedToStartDeferring) should make
// this unnecessary in all but the most extreme cases.  Make sure to check
// that the increased icache and dcache footprint of the tagged result is
// worth it.

// SharedMutex's use of thread local storage is an optimization, so
// for the case where thread local storage is not supported, define it
// away.

// Note about TSAN (ThreadSanitizer): the SharedMutexWritePriority version
// (the default) of this mutex is annotated appropriately so that TSAN can
// perform lock inversion analysis. However, the SharedMutexReadPriority version
// is not annotated.  This is because TSAN's lock order heuristic
// assumes that two calls to lock_shared must be ordered, which leads
// to too many false positives for the reader-priority case.
//
// Suppose thread A holds a SharedMutexWritePriority lock in shared mode and an
// independent thread B is waiting for exclusive access. Then a thread C's
// lock_shared can't proceed until A has released the lock. Discounting
// situations that never use exclusive mode (so no lock is necessary at all)
// this means that without higher-level reasoning it is not safe to ignore
// reader <-> reader interactions.
//
// This reasoning does not apply to SharedMutexReadPriority, because there are
// no actions by a thread B that can make C need to wait for A. Since the
// overwhelming majority of SharedMutex instances use write priority, we
// restrict the TSAN annotations to only SharedMutexWritePriority.

#ifndef FOLLY_SHAREDMUTEX_TLS
#if !FOLLY_MOBILE
#define FOLLY_SHAREDMUTEX_TLS FOLLY_TLS
#else
#define FOLLY_SHAREDMUTEX_TLS
#endif
#endif

namespace folly {

struct SharedMutexToken {
  enum class Type : uint16_t {
    INVALID = 0,
    INLINE_SHARED,
    DEFERRED_SHARED,
  };

  Type type_;
  uint16_t slot_;
};

namespace detail {
// Returns a guard that gives permission for the current thread to
// annotate, and adjust the annotation bits in, the SharedMutex at ptr.
std::unique_lock<std::mutex> sharedMutexAnnotationGuard(void* ptr);
} // namespace detail

template <
    bool ReaderPriority,
    typename Tag_ = void,
    template <typename> class Atom = std::atomic,
    bool BlockImmediately = false,
    bool AnnotateForThreadSanitizer = kIsSanitizeThread && !ReaderPriority>
class SharedMutexImpl {
 public:
  static constexpr bool kReaderPriority = ReaderPriority;

  typedef Tag_ Tag;

  typedef SharedMutexToken Token;

  class ReadHolder;
  class UpgradeHolder;
  class WriteHolder;

  constexpr SharedMutexImpl() noexcept : state_(0) {}

  SharedMutexImpl(const SharedMutexImpl&) = delete;
  SharedMutexImpl(SharedMutexImpl&&) = delete;
  SharedMutexImpl& operator=(const SharedMutexImpl&) = delete;
  SharedMutexImpl& operator=(SharedMutexImpl&&) = delete;

  // It is an error to destroy an SharedMutex that still has
  // any outstanding locks.  This is checked if NDEBUG isn't defined.
  // SharedMutex's exclusive mode can be safely used to guard the lock's
  // own destruction.  If, for example, you acquire the lock in exclusive
  // mode and then observe that the object containing the lock is no longer
  // needed, you can unlock() and then immediately destroy the lock.
  // See https://sourceware.org/bugzilla/show_bug.cgi?id=13690 for a
  // description about why this property needs to be explicitly mentioned.
  ~SharedMutexImpl() {
    auto state = state_.load(std::memory_order_relaxed);
    if (UNLIKELY((state & kHasS) != 0)) {
      cleanupTokenlessSharedDeferred(state);
    }

#ifndef NDEBUG
    // These asserts check that everybody has released the lock before it
    // is destroyed.  If you arrive here while debugging that is likely
    // the problem.  (You could also have general heap corruption.)

    // if a futexWait fails to go to sleep because the value has been
    // changed, we don't necessarily clean up the wait bits, so it is
    // possible they will be set here in a correct system
    assert((state & ~(kWaitingAny | kMayDefer | kAnnotationCreated)) == 0);
    if ((state & kMayDefer) != 0) {
      for (uint32_t slot = 0; slot < kMaxDeferredReaders; ++slot) {
        auto slotValue = deferredReader(slot)->load(std::memory_order_relaxed);
        assert(!slotValueIsThis(slotValue));
      }
    }
#endif
    annotateDestroy();
  }

  void lock() {
    WaitForever ctx;
    (void)lockExclusiveImpl(kHasSolo, ctx);
    annotateAcquired(annotate_rwlock_level::wrlock);
  }

  bool try_lock() {
    WaitNever ctx;
    auto result = lockExclusiveImpl(kHasSolo, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::wrlock);
    return result;
  }

  template <class Rep, class Period>
  bool try_lock_for(const std::chrono::duration<Rep, Period>& duration) {
    WaitForDuration<Rep, Period> ctx(duration);
    auto result = lockExclusiveImpl(kHasSolo, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::wrlock);
    return result;
  }

  template <class Clock, class Duration>
  bool try_lock_until(
      const std::chrono::time_point<Clock, Duration>& absDeadline) {
    WaitUntilDeadline<Clock, Duration> ctx{absDeadline};
    auto result = lockExclusiveImpl(kHasSolo, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::wrlock);
    return result;
  }

  void unlock() {
    annotateReleased(annotate_rwlock_level::wrlock);
    // It is possible that we have a left-over kWaitingNotS if the last
    // unlock_shared() that let our matching lock() complete finished
    // releasing before lock()'s futexWait went to sleep.  Clean it up now
    auto state = (state_ &= ~(kWaitingNotS | kPrevDefer | kHasE));
    assert((state & ~(kWaitingAny | kAnnotationCreated)) == 0);
    wakeRegisteredWaiters(state, kWaitingE | kWaitingU | kWaitingS);
  }

  // Managing the token yourself makes unlock_shared a bit faster

  void lock_shared() {
    WaitForever ctx;
    (void)lockSharedImpl(nullptr, ctx);
    annotateAcquired(annotate_rwlock_level::rdlock);
  }

  void lock_shared(Token& token) {
    WaitForever ctx;
    (void)lockSharedImpl(&token, ctx);
    annotateAcquired(annotate_rwlock_level::rdlock);
  }

  bool try_lock_shared() {
    WaitNever ctx;
    auto result = lockSharedImpl(nullptr, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  bool try_lock_shared(Token& token) {
    WaitNever ctx;
    auto result = lockSharedImpl(&token, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  template <class Rep, class Period>
  bool try_lock_shared_for(const std::chrono::duration<Rep, Period>& duration) {
    WaitForDuration<Rep, Period> ctx(duration);
    auto result = lockSharedImpl(nullptr, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  template <class Rep, class Period>
  bool try_lock_shared_for(
      const std::chrono::duration<Rep, Period>& duration,
      Token& token) {
    WaitForDuration<Rep, Period> ctx(duration);
    auto result = lockSharedImpl(&token, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  template <class Clock, class Duration>
  bool try_lock_shared_until(
      const std::chrono::time_point<Clock, Duration>& absDeadline) {
    WaitUntilDeadline<Clock, Duration> ctx{absDeadline};
    auto result = lockSharedImpl(nullptr, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  template <class Clock, class Duration>
  bool try_lock_shared_until(
      const std::chrono::time_point<Clock, Duration>& absDeadline,
      Token& token) {
    WaitUntilDeadline<Clock, Duration> ctx{absDeadline};
    auto result = lockSharedImpl(&token, ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  void unlock_shared() {
    annotateReleased(annotate_rwlock_level::rdlock);

    auto state = state_.load(std::memory_order_acquire);

    // kPrevDefer can only be set if HasE or BegunE is set
    assert((state & (kPrevDefer | kHasE | kBegunE)) != kPrevDefer);

    // lock() strips kMayDefer immediately, but then copies it to
    // kPrevDefer so we can tell if the pre-lock() lock_shared() might
    // have deferred
    if ((state & (kMayDefer | kPrevDefer)) == 0 ||
        !tryUnlockTokenlessSharedDeferred()) {
      // Matching lock_shared() couldn't have deferred, or the deferred
      // lock has already been inlined by applyDeferredReaders()
      unlockSharedInline();
    }
  }

  void unlock_shared(Token& token) {
    annotateReleased(annotate_rwlock_level::rdlock);

    assert(
        token.type_ == Token::Type::INLINE_SHARED ||
        token.type_ == Token::Type::DEFERRED_SHARED);

    if (token.type_ != Token::Type::DEFERRED_SHARED ||
        !tryUnlockSharedDeferred(token.slot_)) {
      unlockSharedInline();
    }
#ifndef NDEBUG
    token.type_ = Token::Type::INVALID;
#endif
  }

  void unlock_and_lock_shared() {
    annotateReleased(annotate_rwlock_level::wrlock);
    annotateAcquired(annotate_rwlock_level::rdlock);
    // We can't use state_ -=, because we need to clear 2 bits (1 of which
    // has an uncertain initial state) and set 1 other.  We might as well
    // clear the relevant wake bits at the same time.  Note that since S
    // doesn't block the beginning of a transition to E (writer priority
    // can cut off new S, reader priority grabs BegunE and blocks deferred
    // S) we need to wake E as well.
    auto state = state_.load(std::memory_order_acquire);
    do {
      assert(
          (state & ~(kWaitingAny | kPrevDefer | kAnnotationCreated)) == kHasE);
    } while (!state_.compare_exchange_strong(
        state, (state & ~(kWaitingAny | kPrevDefer | kHasE)) + kIncrHasS));
    if ((state & (kWaitingE | kWaitingU | kWaitingS)) != 0) {
      futexWakeAll(kWaitingE | kWaitingU | kWaitingS);
    }
  }

  void unlock_and_lock_shared(Token& token) {
    unlock_and_lock_shared();
    token.type_ = Token::Type::INLINE_SHARED;
  }

  void lock_upgrade() {
    WaitForever ctx;
    (void)lockUpgradeImpl(ctx);
    // For TSAN: treat upgrade locks as equivalent to read locks
    annotateAcquired(annotate_rwlock_level::rdlock);
  }

  bool try_lock_upgrade() {
    WaitNever ctx;
    auto result = lockUpgradeImpl(ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  template <class Rep, class Period>
  bool try_lock_upgrade_for(
      const std::chrono::duration<Rep, Period>& duration) {
    WaitForDuration<Rep, Period> ctx(duration);
    auto result = lockUpgradeImpl(ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  template <class Clock, class Duration>
  bool try_lock_upgrade_until(
      const std::chrono::time_point<Clock, Duration>& absDeadline) {
    WaitUntilDeadline<Clock, Duration> ctx{absDeadline};
    auto result = lockUpgradeImpl(ctx);
    annotateTryAcquired(result, annotate_rwlock_level::rdlock);
    return result;
  }

  void unlock_upgrade() {
    annotateReleased(annotate_rwlock_level::rdlock);
    auto state = (state_ -= kHasU);
    assert((state & (kWaitingNotS | kHasSolo)) == 0);
    wakeRegisteredWaiters(state, kWaitingE | kWaitingU);
  }

  void unlock_upgrade_and_lock() {
    // no waiting necessary, so waitMask is empty
    WaitForever ctx;
    (void)lockExclusiveImpl(0, ctx);
    annotateReleased(annotate_rwlock_level::rdlock);
    annotateAcquired(annotate_rwlock_level::wrlock);
  }

  void unlock_upgrade_and_lock_shared() {
    // No need to annotate for TSAN here because we model upgrade and shared
    // locks as the same.
    auto state = (state_ -= kHasU - kIncrHasS);
    assert((state & (kWaitingNotS | kHasSolo)) == 0);
    wakeRegisteredWaiters(state, kWaitingE | kWaitingU);
  }

  void unlock_upgrade_and_lock_shared(Token& token) {
    unlock_upgrade_and_lock_shared();
    token.type_ = Token::Type::INLINE_SHARED;
  }

  void unlock_and_lock_upgrade() {
    annotateReleased(annotate_rwlock_level::wrlock);
    annotateAcquired(annotate_rwlock_level::rdlock);
    // We can't use state_ -=, because we need to clear 2 bits (1 of
    // which has an uncertain initial state) and set 1 other.  We might
    // as well clear the relevant wake bits at the same time.
    auto state = state_.load(std::memory_order_acquire);
    while (true) {
      assert(
          (state & ~(kWaitingAny | kPrevDefer | kAnnotationCreated)) == kHasE);
      auto after =
          (state & ~(kWaitingNotS | kWaitingS | kPrevDefer | kHasE)) + kHasU;
      if (state_.compare_exchange_strong(state, after)) {
        if ((state & kWaitingS) != 0) {
          futexWakeAll(kWaitingS);
        }
        return;
      }
    }
  }

 private:
  typedef typename folly::detail::Futex<Atom> Futex;

  // Internally we use four kinds of wait contexts.  These are structs
  // that provide a doWait method that returns true if a futex wake
  // was issued that intersects with the waitMask, false if there was a
  // timeout and no more waiting should be performed.  Spinning occurs
  // before the wait context is invoked.

  struct WaitForever {
    bool canBlock() {
      return true;
    }
    bool canTimeOut() {
      return false;
    }
    bool shouldTimeOut() {
      return false;
    }

    bool doWait(Futex& futex, uint32_t expected, uint32_t waitMask) {
      detail::futexWait(&futex, expected, waitMask);
      return true;
    }
  };

  struct WaitNever {
    bool canBlock() {
      return false;
    }
    bool canTimeOut() {
      return true;
    }
    bool shouldTimeOut() {
      return true;
    }

    bool doWait(
        Futex& /* futex */,
        uint32_t /* expected */,
        uint32_t /* waitMask */) {
      return false;
    }
  };

  template <class Rep, class Period>
  struct WaitForDuration {
    std::chrono::duration<Rep, Period> duration_;
    bool deadlineComputed_;
    std::chrono::steady_clock::time_point deadline_;

    explicit WaitForDuration(const std::chrono::duration<Rep, Period>& duration)
        : duration_(duration), deadlineComputed_(false) {}

    std::chrono::steady_clock::time_point deadline() {
      if (!deadlineComputed_) {
        deadline_ = std::chrono::steady_clock::now() + duration_;
        deadlineComputed_ = true;
      }
      return deadline_;
    }

    bool canBlock() {
      return duration_.count() > 0;
    }
    bool canTimeOut() {
      return true;
    }

    bool shouldTimeOut() {
      return std::chrono::steady_clock::now() > deadline();
    }

    bool doWait(Futex& futex, uint32_t expected, uint32_t waitMask) {
      auto result =
          detail::futexWaitUntil(&futex, expected, deadline(), waitMask);
      return result != folly::detail::FutexResult::TIMEDOUT;
    }
  };

  template <class Clock, class Duration>
  struct WaitUntilDeadline {
    std::chrono::time_point<Clock, Duration> absDeadline_;

    bool canBlock() {
      return true;
    }
    bool canTimeOut() {
      return true;
    }
    bool shouldTimeOut() {
      return Clock::now() > absDeadline_;
    }

    bool doWait(Futex& futex, uint32_t expected, uint32_t waitMask) {
      auto result =
          detail::futexWaitUntil(&futex, expected, absDeadline_, waitMask);
      return result != folly::detail::FutexResult::TIMEDOUT;
    }
  };

  void annotateLazyCreate() {
    if (AnnotateForThreadSanitizer &&
        (state_.load() & kAnnotationCreated) == 0) {
      auto guard = detail::sharedMutexAnnotationGuard(this);
      // check again
      if ((state_.load() & kAnnotationCreated) == 0) {
        state_.fetch_or(kAnnotationCreated);
        annotate_benign_race_sized(
            &state_, sizeof(state_), "init TSAN", __FILE__, __LINE__);
        annotate_rwlock_create(this, __FILE__, __LINE__);
      }
    }
  }

  void annotateDestroy() {
    if (AnnotateForThreadSanitizer) {
      annotateLazyCreate();
      annotate_rwlock_destroy(this, __FILE__, __LINE__);
    }
  }

  void annotateAcquired(annotate_rwlock_level w) {
    if (AnnotateForThreadSanitizer) {
      annotateLazyCreate();
      annotate_rwlock_acquired(this, w, __FILE__, __LINE__);
    }
  }

  void annotateTryAcquired(bool result, annotate_rwlock_level w) {
    if (AnnotateForThreadSanitizer) {
      annotateLazyCreate();
      annotate_rwlock_try_acquired(this, w, result, __FILE__, __LINE__);
    }
  }

  void annotateReleased(annotate_rwlock_level w) {
    if (AnnotateForThreadSanitizer) {
      assert((state_.load() & kAnnotationCreated) != 0);
      annotate_rwlock_released(this, w, __FILE__, __LINE__);
    }
  }

  // 32 bits of state
  Futex state_{};

  // S count needs to be on the end, because we explicitly allow it to
  // underflow.  This can occur while we are in the middle of applying
  // deferred locks (we remove them from deferredReaders[] before
  // inlining them), or during token-less unlock_shared() if a racing
  // lock_shared();unlock_shared() moves the deferredReaders slot while
  // the first unlock_shared() is scanning.  The former case is cleaned
  // up before we finish applying the locks.  The latter case can persist
  // until destruction, when it is cleaned up.
  static constexpr uint32_t kIncrHasS = 1 << 11;
  static constexpr uint32_t kHasS = ~(kIncrHasS - 1);

  // Set if annotation has been completed for this instance.  That annotation
  // (and setting this bit afterward) must be guarded by one of the mutexes in
  // annotationCreationGuards.
  static constexpr uint32_t kAnnotationCreated = 1 << 10;

  // If false, then there are definitely no deferred read locks for this
  // instance.  Cleared after initialization and when exclusively locked.
  static constexpr uint32_t kMayDefer = 1 << 9;

  // lock() cleared kMayDefer as soon as it starts draining readers (so
  // that it doesn't have to do a second CAS once drain completes), but
  // unlock_shared() still needs to know whether to scan deferredReaders[]
  // or not.  We copy kMayDefer to kPrevDefer when setting kHasE or
  // kBegunE, and clear it when clearing those bits.
  static constexpr uint32_t kPrevDefer = 1 << 8;

  // Exclusive-locked blocks all read locks and write locks.  This bit
  // may be set before all readers have finished, but in that case the
  // thread that sets it won't return to the caller until all read locks
  // have been released.
  static constexpr uint32_t kHasE = 1 << 7;

  // Exclusive-draining means that lock() is waiting for existing readers
  // to leave, but that new readers may still acquire shared access.
  // This is only used in reader priority mode.  New readers during
  // drain must be inline.  The difference between this and kHasU is that
  // kBegunE prevents kMayDefer from being set.
  static constexpr uint32_t kBegunE = 1 << 6;

  // At most one thread may have either exclusive or upgrade lock
  // ownership.  Unlike exclusive mode, ownership of the lock in upgrade
  // mode doesn't preclude other threads holding the lock in shared mode.
  // boost's concept for this doesn't explicitly say whether new shared
  // locks can be acquired one lock_upgrade has succeeded, but doesn't
  // list that as disallowed.  RWSpinLock disallows new read locks after
  // lock_upgrade has been acquired, but the boost implementation doesn't.
  // We choose the latter.
  static constexpr uint32_t kHasU = 1 << 5;

  // There are three states that we consider to be "solo", in that they
  // cannot coexist with other solo states.  These are kHasE, kBegunE,
  // and kHasU.  Note that S doesn't conflict with any of these, because
  // setting the kHasE is only one of the two steps needed to actually
  // acquire the lock in exclusive mode (the other is draining the existing
  // S holders).
  static constexpr uint32_t kHasSolo = kHasE | kBegunE | kHasU;

  // Once a thread sets kHasE it needs to wait for the current readers
  // to exit the lock.  We give this a separate wait identity from the
  // waiting to set kHasE so that we can perform partial wakeups (wake
  // one instead of wake all).
  static constexpr uint32_t kWaitingNotS = 1 << 4;

  // When waking writers we can either wake them all, in which case we
  // can clear kWaitingE, or we can call futexWake(1).  futexWake tells
  // us if anybody woke up, but even if we detect that nobody woke up we
  // can't clear the bit after the fact without issuing another wakeup.
  // To avoid thundering herds when there are lots of pending lock()
  // without needing to call futexWake twice when there is only one
  // waiter, kWaitingE actually encodes if we have observed multiple
  // concurrent waiters.  Tricky: ABA issues on futexWait mean that when
  // we see kWaitingESingle we can't assume that there is only one.
  static constexpr uint32_t kWaitingESingle = 1 << 2;
  static constexpr uint32_t kWaitingEMultiple = 1 << 3;
  static constexpr uint32_t kWaitingE = kWaitingESingle | kWaitingEMultiple;

  // kWaitingU is essentially a 1 bit saturating counter.  It always
  // requires a wakeAll.
  static constexpr uint32_t kWaitingU = 1 << 1;

  // All blocked lock_shared() should be awoken, so it is correct (not
  // suboptimal) to wakeAll if there are any shared readers.
  static constexpr uint32_t kWaitingS = 1 << 0;

  // kWaitingAny is a mask of all of the bits that record the state of
  // threads, rather than the state of the lock.  It is convenient to be
  // able to mask them off during asserts.
  static constexpr uint32_t kWaitingAny =
      kWaitingNotS | kWaitingE | kWaitingU | kWaitingS;

  // The reader count at which a reader will attempt to use the lock
  // in deferred mode.  If this value is 2, then the second concurrent
  // reader will set kMayDefer and use deferredReaders[].  kMayDefer is
  // cleared during exclusive access, so this threshold must be reached
  // each time a lock is held in exclusive mode.
  static constexpr uint32_t kNumSharedToStartDeferring = 2;

  // The typical number of spins that a thread will wait for a state
  // transition.  There is no bound on the number of threads that can wait
  // for a writer, so we are pretty conservative here to limit the chance
  // that we are starving the writer of CPU.  Each spin is 6 or 7 nanos,
  // almost all of which is in the pause instruction.
  static constexpr uint32_t kMaxSpinCount = !BlockImmediately ? 1000 : 2;

  // The maximum number of soft yields before falling back to futex.
  // If the preemption heuristic is activated we will fall back before
  // this.  A soft yield takes ~900 nanos (two sched_yield plus a call
  // to getrusage, with checks of the goal at each step).  Soft yields
  // aren't compatible with deterministic execution under test (unlike
  // futexWaitUntil, which has a capricious but deterministic back end).
  static constexpr uint32_t kMaxSoftYieldCount = !BlockImmediately ? 1000 : 0;

  // If AccessSpreader assigns indexes from 0..k*n-1 on a system where some
  // level of the memory hierarchy is symmetrically divided into k pieces
  // (NUMA nodes, last-level caches, L1 caches, ...), then slot indexes
  // that are the same after integer division by k share that resource.
  // Our strategy for deferred readers is to probe up to numSlots/4 slots,
  // using the full granularity of AccessSpreader for the start slot
  // and then search outward.  We can use AccessSpreader::current(n)
  // without managing our own spreader if kMaxDeferredReaders <=
  // AccessSpreader::kMaxCpus, which is currently 128.
  //
  // Our 2-socket E5-2660 machines have 8 L1 caches on each chip,
  // with 64 byte cache lines.  That means we need 64*16 bytes of
  // deferredReaders[] to give each L1 its own playground.  On x86_64
  // each DeferredReaderSlot is 8 bytes, so we need kMaxDeferredReaders
  // * kDeferredSeparationFactor >= 64 * 16 / 8 == 128.  If
  // kDeferredSearchDistance * kDeferredSeparationFactor <=
  // 64 / 8 then we will search only within a single cache line, which
  // guarantees we won't have inter-L1 contention.  We give ourselves
  // a factor of 2 on the core count, which should hold us for a couple
  // processor generations.  deferredReaders[] is 2048 bytes currently.
 public:
  static constexpr uint32_t kMaxDeferredReaders = 64;
  static constexpr uint32_t kDeferredSearchDistance = 2;
  static constexpr uint32_t kDeferredSeparationFactor = 4;

 private:
  static_assert(
      !(kMaxDeferredReaders & (kMaxDeferredReaders - 1)),
      "kMaxDeferredReaders must be a power of 2");
  static_assert(
      !(kDeferredSearchDistance & (kDeferredSearchDistance - 1)),
      "kDeferredSearchDistance must be a power of 2");

  // The number of deferred locks that can be simultaneously acquired
  // by a thread via the token-less methods without performing any heap
  // allocations.  Each of these costs 3 pointers (24 bytes, probably)
  // per thread.  There's not much point in making this larger than
  // kDeferredSearchDistance.
  static constexpr uint32_t kTokenStackTLSCapacity = 2;

  // We need to make sure that if there is a lock_shared()
  // and lock_shared(token) followed by unlock_shared() and
  // unlock_shared(token), the token-less unlock doesn't null
  // out deferredReaders[token.slot_].  If we allowed that, then
  // unlock_shared(token) wouldn't be able to assume that its lock
  // had been inlined by applyDeferredReaders when it finds that
  // deferredReaders[token.slot_] no longer points to this.  We accomplish
  // this by stealing bit 0 from the pointer to record that the slot's
  // element has no token, hence our use of uintptr_t in deferredReaders[].
  static constexpr uintptr_t kTokenless = 0x1;

  // This is the starting location for Token-less unlock_shared().
  static FOLLY_SHAREDMUTEX_TLS uint32_t tls_lastTokenlessSlot;

  // Last deferred reader slot used.
  static FOLLY_SHAREDMUTEX_TLS uint32_t tls_lastDeferredReaderSlot;

  // Only indexes divisible by kDeferredSeparationFactor are used.
  // If any of those elements points to a SharedMutexImpl, then it
  // should be considered that there is a shared lock on that instance.
  // See kTokenless.
 public:
  typedef Atom<uintptr_t> DeferredReaderSlot;

 private:
  alignas(hardware_destructive_interference_size) static DeferredReaderSlot
      deferredReaders[kMaxDeferredReaders * kDeferredSeparationFactor];

  // Performs an exclusive lock, waiting for state_ & waitMask to be
  // zero first
  template <class WaitContext>
  bool lockExclusiveImpl(uint32_t preconditionGoalMask, WaitContext& ctx) {
    uint32_t state = state_.load(std::memory_order_acquire);
    if (LIKELY(
            (state & (preconditionGoalMask | kMayDefer | kHasS)) == 0 &&
            state_.compare_exchange_strong(state, (state | kHasE) & ~kHasU))) {
      return true;
    } else {
      return lockExclusiveImpl(state, preconditionGoalMask, ctx);
    }
  }

  template <class WaitContext>
  bool lockExclusiveImpl(
      uint32_t& state,
      uint32_t preconditionGoalMask,
      WaitContext& ctx) {
    while (true) {
      if (UNLIKELY((state & preconditionGoalMask) != 0) &&
          !waitForZeroBits(state, preconditionGoalMask, kWaitingE, ctx) &&
          ctx.canTimeOut()) {
        return false;
      }

      uint32_t after = (state & kMayDefer) == 0 ? 0 : kPrevDefer;
      if (!kReaderPriority || (state & (kMayDefer | kHasS)) == 0) {
        // Block readers immediately, either because we are in write
        // priority mode or because we can acquire the lock in one
        // step.  Note that if state has kHasU, then we are doing an
        // unlock_upgrade_and_lock() and we should clear it (reader
        // priority branch also does this).
        after |= (state | kHasE) & ~(kHasU | kMayDefer);
      } else {
        after |= (state | kBegunE) & ~(kHasU | kMayDefer);
      }
      if (state_.compare_exchange_strong(state, after)) {
        auto before = state;
        state = after;

        // If we set kHasE (writer priority) then no new readers can
        // arrive.  If we set kBegunE then they can still enter, but
        // they must be inline.  Either way we need to either spin on
        // deferredReaders[] slots, or inline them so that we can wait on
        // kHasS to zero itself.  deferredReaders[] is pointers, which on
        // x86_64 are bigger than futex() can handle, so we inline the
        // deferred locks instead of trying to futexWait on each slot.
        // Readers are responsible for rechecking state_ after recording
        // a deferred read to avoid atomicity problems between the state_
        // CAS and applyDeferredReader's reads of deferredReaders[].
        if (UNLIKELY((before & kMayDefer) != 0)) {
          applyDeferredReaders(state, ctx);
        }
        while (true) {
          assert((state & (kHasE | kBegunE)) != 0 && (state & kHasU) == 0);
          if (UNLIKELY((state & kHasS) != 0) &&
              !waitForZeroBits(state, kHasS, kWaitingNotS, ctx) &&
              ctx.canTimeOut()) {
            // Ugh.  We blocked new readers and other writers for a while,
            // but were unable to complete.  Move on.  On the plus side
            // we can clear kWaitingNotS because nobody else can piggyback
            // on it.
            state = (state_ &= ~(kPrevDefer | kHasE | kBegunE | kWaitingNotS));
            wakeRegisteredWaiters(state, kWaitingE | kWaitingU | kWaitingS);
            return false;
          }

          if (kReaderPriority && (state & kHasE) == 0) {
            assert((state & kBegunE) != 0);
            if (!state_.compare_exchange_strong(
                    state, (state & ~kBegunE) | kHasE)) {
              continue;
            }
          }

          return true;
        }
      }
    }
  }

  template <class WaitContext>
  bool waitForZeroBits(
      uint32_t& state,
      uint32_t goal,
      uint32_t waitMask,
      WaitContext& ctx) {
    uint32_t spinCount = 0;
    while (true) {
      state = state_.load(std::memory_order_acquire);
      if ((state & goal) == 0) {
        return true;
      }
      asm_volatile_pause();
      ++spinCount;
      if (UNLIKELY(spinCount >= kMaxSpinCount)) {
        return ctx.canBlock() &&
            yieldWaitForZeroBits(state, goal, waitMask, ctx);
      }
    }
  }

  template <class WaitContext>
  bool yieldWaitForZeroBits(
      uint32_t& state,
      uint32_t goal,
      uint32_t waitMask,
      WaitContext& ctx) {
#ifdef RUSAGE_THREAD
    struct rusage usage;
    std::memset(&usage, 0, sizeof(usage));
    long before = -1;
#endif
    for (uint32_t yieldCount = 0; yieldCount < kMaxSoftYieldCount;
         ++yieldCount) {
      for (int softState = 0; softState < 3; ++softState) {
        if (softState < 2) {
          std::this_thread::yield();
        } else {
#ifdef RUSAGE_THREAD
          getrusage(RUSAGE_THREAD, &usage);
#endif
        }
        if (((state = state_.load(std::memory_order_acquire)) & goal) == 0) {
          return true;
        }
        if (ctx.shouldTimeOut()) {
          return false;
        }
      }
#ifdef RUSAGE_THREAD
      if (before >= 0 && usage.ru_nivcsw >= before + 2) {
        // One involuntary csw might just be occasional background work,
        // but if we get two in a row then we guess that there is someone
        // else who can profitably use this CPU.  Fall back to futex
        break;
      }
      before = usage.ru_nivcsw;
#endif
    }
    return futexWaitForZeroBits(state, goal, waitMask, ctx);
  }

  template <class WaitContext>
  bool futexWaitForZeroBits(
      uint32_t& state,
      uint32_t goal,
      uint32_t waitMask,
      WaitContext& ctx) {
    assert(
        waitMask == kWaitingNotS || waitMask == kWaitingE ||
        waitMask == kWaitingU || waitMask == kWaitingS);

    while (true) {
      state = state_.load(std::memory_order_acquire);
      if ((state & goal) == 0) {
        return true;
      }

      auto after = state;
      if (waitMask == kWaitingE) {
        if ((state & kWaitingESingle) != 0) {
          after |= kWaitingEMultiple;
        } else {
          after |= kWaitingESingle;
        }
      } else {
        after |= waitMask;
      }

      // CAS is better than atomic |= here, because it lets us avoid
      // setting the wait flag when the goal is concurrently achieved
      if (after != state && !state_.compare_exchange_strong(state, after)) {
        continue;
      }

      if (!ctx.doWait(state_, after, waitMask)) {
        // timed out
        return false;
      }
    }
  }

  // Wakes up waiters registered in state_ as appropriate, clearing the
  // awaiting bits for anybody that was awoken.  Tries to perform direct
  // single wakeup of an exclusive waiter if appropriate
  void wakeRegisteredWaiters(uint32_t& state, uint32_t wakeMask) {
    if (UNLIKELY((state & wakeMask) != 0)) {
      wakeRegisteredWaitersImpl(state, wakeMask);
    }
  }

  void wakeRegisteredWaitersImpl(uint32_t& state, uint32_t wakeMask) {
    // If there are multiple lock() pending only one of them will actually
    // get to wake up, so issuing futexWakeAll will make a thundering herd.
    // There's nothing stopping us from issuing futexWake(1) instead,
    // so long as the wait bits are still an accurate reflection of
    // the waiters.  If we notice (via futexWake's return value) that
    // nobody woke up then we can try again with the normal wake-all path.
    // Note that we can't just clear the bits at that point; we need to
    // clear the bits and then issue another wakeup.
    //
    // It is possible that we wake an E waiter but an outside S grabs the
    // lock instead, at which point we should wake pending U and S waiters.
    // Rather than tracking state to make the failing E regenerate the
    // wakeup, we just disable the optimization in the case that there
    // are waiting U or S that we are eligible to wake.
    if ((wakeMask & kWaitingE) == kWaitingE &&
        (state & wakeMask) == kWaitingE &&
        detail::futexWake(&state_, 1, kWaitingE) > 0) {
      // somebody woke up, so leave state_ as is and clear it later
      return;
    }

    if ((state & wakeMask) != 0) {
      auto prev = state_.fetch_and(~wakeMask);
      if ((prev & wakeMask) != 0) {
        futexWakeAll(wakeMask);
      }
      state = prev & ~wakeMask;
    }
  }

  void futexWakeAll(uint32_t wakeMask) {
    detail::futexWake(&state_, std::numeric_limits<int>::max(), wakeMask);
  }

  DeferredReaderSlot* deferredReader(uint32_t slot) {
    return &deferredReaders[slot * kDeferredSeparationFactor];
  }

  uintptr_t tokenfulSlotValue() {
    return reinterpret_cast<uintptr_t>(this);
  }

  uintptr_t tokenlessSlotValue() {
    return tokenfulSlotValue() | kTokenless;
  }

  bool slotValueIsThis(uintptr_t slotValue) {
    return (slotValue & ~kTokenless) == tokenfulSlotValue();
  }

  // Clears any deferredReaders[] that point to this, adjusting the inline
  // shared lock count to compensate.  Does some spinning and yielding
  // to avoid the work.  Always finishes the application, even if ctx
  // times out.
  template <class WaitContext>
  void applyDeferredReaders(uint32_t& state, WaitContext& ctx) {
    uint32_t slot = 0;

    uint32_t spinCount = 0;
    while (true) {
      while (!slotValueIsThis(
          deferredReader(slot)->load(std::memory_order_acquire))) {
        if (++slot == kMaxDeferredReaders) {
          return;
        }
      }
      asm_volatile_pause();
      if (UNLIKELY(++spinCount >= kMaxSpinCount)) {
        applyDeferredReaders(state, ctx, slot);
        return;
      }
    }
  }

  template <class WaitContext>
  void applyDeferredReaders(uint32_t& state, WaitContext& ctx, uint32_t slot) {
#ifdef RUSAGE_THREAD
    struct rusage usage;
    std::memset(&usage, 0, sizeof(usage));
    long before = -1;
#endif
    for (uint32_t yieldCount = 0; yieldCount < kMaxSoftYieldCount;
         ++yieldCount) {
      for (int softState = 0; softState < 3; ++softState) {
        if (softState < 2) {
          std::this_thread::yield();
        } else {
#ifdef RUSAGE_THREAD
          getrusage(RUSAGE_THREAD, &usage);
#endif
        }
        while (!slotValueIsThis(
            deferredReader(slot)->load(std::memory_order_acquire))) {
          if (++slot == kMaxDeferredReaders) {
            return;
          }
        }
        if (ctx.shouldTimeOut()) {
          // finish applying immediately on timeout
          break;
        }
      }
#ifdef RUSAGE_THREAD
      if (before >= 0 && usage.ru_nivcsw >= before + 2) {
        // heuristic says run queue is not empty
        break;
      }
      before = usage.ru_nivcsw;
#endif
    }

    uint32_t movedSlotCount = 0;
    for (; slot < kMaxDeferredReaders; ++slot) {
      auto slotPtr = deferredReader(slot);
      auto slotValue = slotPtr->load(std::memory_order_acquire);
      if (slotValueIsThis(slotValue) &&
          slotPtr->compare_exchange_strong(slotValue, 0)) {
        ++movedSlotCount;
      }
    }

    if (movedSlotCount > 0) {
      state = (state_ += movedSlotCount * kIncrHasS);
    }
    assert((state & (kHasE | kBegunE)) != 0);

    // if state + kIncrHasS overflows (off the end of state) then either
    // we have 2^(32-9) readers (almost certainly an application bug)
    // or we had an underflow (also a bug)
    assert(state < state + kIncrHasS);
  }

  // It is straightfoward to make a token-less lock_shared() and
  // unlock_shared() either by making the token-less version always use
  // INLINE_SHARED mode or by removing the token version.  Supporting
  // deferred operation for both types is trickier than it appears, because
  // the purpose of the token it so that unlock_shared doesn't have to
  // look in other slots for its deferred lock.  Token-less unlock_shared
  // might place a deferred lock in one place and then release a different
  // slot that was originally used by the token-ful version.  If this was
  // important we could solve the problem by differentiating the deferred
  // locks so that cross-variety release wouldn't occur.  The best way
  // is probably to steal a bit from the pointer, making deferredLocks[]
  // an array of Atom<uintptr_t>.

  template <class WaitContext>
  bool lockSharedImpl(Token* token, WaitContext& ctx) {
    uint32_t state = state_.load(std::memory_order_relaxed);
    if ((state & (kHasS | kMayDefer | kHasE)) == 0 &&
        state_.compare_exchange_strong(state, state + kIncrHasS)) {
      if (token != nullptr) {
        token->type_ = Token::Type::INLINE_SHARED;
      }
      return true;
    }
    return lockSharedImpl(state, token, ctx);
  }

  template <class WaitContext>
  bool lockSharedImpl(uint32_t& state, Token* token, WaitContext& ctx);

  // Updates the state in/out argument as if the locks were made inline,
  // but does not update state_
  void cleanupTokenlessSharedDeferred(uint32_t& state) {
    for (uint32_t i = 0; i < kMaxDeferredReaders; ++i) {
      auto slotPtr = deferredReader(i);
      auto slotValue = slotPtr->load(std::memory_order_relaxed);
      if (slotValue == tokenlessSlotValue()) {
        slotPtr->store(0, std::memory_order_relaxed);
        state += kIncrHasS;
        if ((state & kHasS) == 0) {
          break;
        }
      }
    }
  }

  bool tryUnlockTokenlessSharedDeferred();

  bool tryUnlockSharedDeferred(uint32_t slot) {
    assert(slot < kMaxDeferredReaders);
    auto slotValue = tokenfulSlotValue();
    return deferredReader(slot)->compare_exchange_strong(slotValue, 0);
  }

  uint32_t unlockSharedInline() {
    uint32_t state = (state_ -= kIncrHasS);
    assert(
        (state & (kHasE | kBegunE | kMayDefer)) != 0 ||
        state < state + kIncrHasS);
    if ((state & kHasS) == 0) {
      // Only the second half of lock() can be blocked by a non-zero
      // reader count, so that's the only thing we need to wake
      wakeRegisteredWaiters(state, kWaitingNotS);
    }
    return state;
  }

  template <class WaitContext>
  bool lockUpgradeImpl(WaitContext& ctx) {
    uint32_t state;
    do {
      if (!waitForZeroBits(state, kHasSolo, kWaitingU, ctx)) {
        return false;
      }
    } while (!state_.compare_exchange_strong(state, state | kHasU));
    return true;
  }

 public:
  class ReadHolder {
    ReadHolder() : lock_(nullptr) {}

   public:
    explicit ReadHolder(const SharedMutexImpl* lock)
        : lock_(const_cast<SharedMutexImpl*>(lock)) {
      if (lock_) {
        lock_->lock_shared(token_);
      }
    }

    explicit ReadHolder(const SharedMutexImpl& lock)
        : lock_(const_cast<SharedMutexImpl*>(&lock)) {
      lock_->lock_shared(token_);
    }

    ReadHolder(ReadHolder&& rhs) noexcept
        : lock_(rhs.lock_), token_(rhs.token_) {
      rhs.lock_ = nullptr;
    }

    // Downgrade from upgrade mode
    explicit ReadHolder(UpgradeHolder&& upgraded) : lock_(upgraded.lock_) {
      assert(upgraded.lock_ != nullptr);
      upgraded.lock_ = nullptr;
      lock_->unlock_upgrade_and_lock_shared(token_);
    }

    // Downgrade from exclusive mode
    explicit ReadHolder(WriteHolder&& writer) : lock_(writer.lock_) {
      assert(writer.lock_ != nullptr);
      writer.lock_ = nullptr;
      lock_->unlock_and_lock_shared(token_);
    }

    ReadHolder& operator=(ReadHolder&& rhs) noexcept {
      std::swap(lock_, rhs.lock_);
      std::swap(token_, rhs.token_);
      return *this;
    }

    ReadHolder(const ReadHolder& rhs) = delete;
    ReadHolder& operator=(const ReadHolder& rhs) = delete;

    ~ReadHolder() {
      unlock();
    }

    void unlock() {
      if (lock_) {
        lock_->unlock_shared(token_);
        lock_ = nullptr;
      }
    }

   private:
    friend class UpgradeHolder;
    friend class WriteHolder;
    SharedMutexImpl* lock_;
    SharedMutexToken token_;
  };

  class UpgradeHolder {
    UpgradeHolder() : lock_(nullptr) {}

   public:
    explicit UpgradeHolder(SharedMutexImpl* lock) : lock_(lock) {
      if (lock_) {
        lock_->lock_upgrade();
      }
    }

    explicit UpgradeHolder(SharedMutexImpl& lock) : lock_(&lock) {
      lock_->lock_upgrade();
    }

    // Downgrade from exclusive mode
    explicit UpgradeHolder(WriteHolder&& writer) : lock_(writer.lock_) {
      assert(writer.lock_ != nullptr);
      writer.lock_ = nullptr;
      lock_->unlock_and_lock_upgrade();
    }

    UpgradeHolder(UpgradeHolder&& rhs) noexcept : lock_(rhs.lock_) {
      rhs.lock_ = nullptr;
    }

    UpgradeHolder& operator=(UpgradeHolder&& rhs) noexcept {
      std::swap(lock_, rhs.lock_);
      return *this;
    }

    UpgradeHolder(const UpgradeHolder& rhs) = delete;
    UpgradeHolder& operator=(const UpgradeHolder& rhs) = delete;

    ~UpgradeHolder() {
      unlock();
    }

    void unlock() {
      if (lock_) {
        lock_->unlock_upgrade();
        lock_ = nullptr;
      }
    }

   private:
    friend class WriteHolder;
    friend class ReadHolder;
    SharedMutexImpl* lock_;
  };

  class WriteHolder {
    WriteHolder() : lock_(nullptr) {}

   public:
    explicit WriteHolder(SharedMutexImpl* lock) : lock_(lock) {
      if (lock_) {
        lock_->lock();
      }
    }

    explicit WriteHolder(SharedMutexImpl& lock) : lock_(&lock) {
      lock_->lock();
    }

    // Promotion from upgrade mode
    explicit WriteHolder(UpgradeHolder&& upgrade) : lock_(upgrade.lock_) {
      assert(upgrade.lock_ != nullptr);
      upgrade.lock_ = nullptr;
      lock_->unlock_upgrade_and_lock();
    }

    // README:
    //
    // It is intended that WriteHolder(ReadHolder&& rhs) do not exist.
    //
    // Shared locks (read) can not safely upgrade to unique locks (write).
    // That upgrade path is a well-known recipe for deadlock, so we explicitly
    // disallow it.
    //
    // If you need to do a conditional mutation, you have a few options:
    // 1. Check the condition under a shared lock and release it.
    //    Then maybe check the condition again under a unique lock and maybe do
    //    the mutation.
    // 2. Check the condition once under an upgradeable lock.
    //    Then maybe upgrade the lock to a unique lock and do the mutation.
    // 3. Check the condition and maybe perform the mutation under a unique
    //    lock.
    //
    // Relevant upgradeable lock notes:
    // * At most one upgradeable lock can be held at a time for a given shared
    //   mutex, just like a unique lock.
    // * An upgradeable lock may be held concurrently with any number of shared
    //   locks.
    // * An upgradeable lock may be upgraded atomically to a unique lock.

    WriteHolder(WriteHolder&& rhs) noexcept : lock_(rhs.lock_) {
      rhs.lock_ = nullptr;
    }

    WriteHolder& operator=(WriteHolder&& rhs) noexcept {
      std::swap(lock_, rhs.lock_);
      return *this;
    }

    WriteHolder(const WriteHolder& rhs) = delete;
    WriteHolder& operator=(const WriteHolder& rhs) = delete;

    ~WriteHolder() {
      unlock();
    }

    void unlock() {
      if (lock_) {
        lock_->unlock();
        lock_ = nullptr;
      }
    }

   private:
    friend class ReadHolder;
    friend class UpgradeHolder;
    SharedMutexImpl* lock_;
  };

  // Adapters for Synchronized<>
  friend void acquireRead(SharedMutexImpl& lock) {
    lock.lock_shared();
  }
  friend void acquireReadWrite(SharedMutexImpl& lock) {
    lock.lock();
  }
  friend void releaseRead(SharedMutexImpl& lock) {
    lock.unlock_shared();
  }
  friend void releaseReadWrite(SharedMutexImpl& lock) {
    lock.unlock();
  }
  friend bool acquireRead(SharedMutexImpl& lock, unsigned int ms) {
    return lock.try_lock_shared_for(std::chrono::milliseconds(ms));
  }
  friend bool acquireReadWrite(SharedMutexImpl& lock, unsigned int ms) {
    return lock.try_lock_for(std::chrono::milliseconds(ms));
  }
};

typedef SharedMutexImpl<true> SharedMutexReadPriority;
typedef SharedMutexImpl<false> SharedMutexWritePriority;
typedef SharedMutexWritePriority SharedMutex;
typedef SharedMutexImpl<false, void, std::atomic, false, false>
    SharedMutexSuppressTSAN;

// Prevent the compiler from instantiating these in other translation units.
// They are instantiated once in SharedMutex.cpp
extern template class SharedMutexImpl<true>;
extern template class SharedMutexImpl<false>;

template <
    bool ReaderPriority,
    typename Tag_,
    template <typename> class Atom,
    bool BlockImmediately,
    bool AnnotateForThreadSanitizer>
alignas(hardware_destructive_interference_size) typename SharedMutexImpl<
    ReaderPriority,
    Tag_,
    Atom,
    BlockImmediately,
    AnnotateForThreadSanitizer>::DeferredReaderSlot
    SharedMutexImpl<
        ReaderPriority,
        Tag_,
        Atom,
        BlockImmediately,
        AnnotateForThreadSanitizer>::deferredReaders
        [kMaxDeferredReaders * kDeferredSeparationFactor] = {};

template <
    bool ReaderPriority,
    typename Tag_,
    template <typename> class Atom,
    bool BlockImmediately,
    bool AnnotateForThreadSanitizer>
FOLLY_SHAREDMUTEX_TLS uint32_t SharedMutexImpl<
    ReaderPriority,
    Tag_,
    Atom,
    BlockImmediately,
    AnnotateForThreadSanitizer>::tls_lastTokenlessSlot = 0;

template <
    bool ReaderPriority,
    typename Tag_,
    template <typename> class Atom,
    bool BlockImmediately,
    bool AnnotateForThreadSanitizer>
FOLLY_SHAREDMUTEX_TLS uint32_t SharedMutexImpl<
    ReaderPriority,
    Tag_,
    Atom,
    BlockImmediately,
    AnnotateForThreadSanitizer>::tls_lastDeferredReaderSlot = 0;

template <
    bool ReaderPriority,
    typename Tag_,
    template <typename> class Atom,
    bool BlockImmediately,
    bool AnnotateForThreadSanitizer>
bool SharedMutexImpl<
    ReaderPriority,
    Tag_,
    Atom,
    BlockImmediately,
    AnnotateForThreadSanitizer>::tryUnlockTokenlessSharedDeferred() {
  auto bestSlot = tls_lastTokenlessSlot;
  for (uint32_t i = 0; i < kMaxDeferredReaders; ++i) {
    auto slotPtr = deferredReader(bestSlot ^ i);
    auto slotValue = slotPtr->load(std::memory_order_relaxed);
    if (slotValue == tokenlessSlotValue() &&
        slotPtr->compare_exchange_strong(slotValue, 0)) {
      tls_lastTokenlessSlot = bestSlot ^ i;
      return true;
    }
  }
  return false;
}

template <
    bool ReaderPriority,
    typename Tag_,
    template <typename> class Atom,
    bool BlockImmediately,
    bool AnnotateForThreadSanitizer>
template <class WaitContext>
bool SharedMutexImpl<
    ReaderPriority,
    Tag_,
    Atom,
    BlockImmediately,
    AnnotateForThreadSanitizer>::
    lockSharedImpl(uint32_t& state, Token* token, WaitContext& ctx) {
  while (true) {
    if (UNLIKELY((state & kHasE) != 0) &&
        !waitForZeroBits(state, kHasE, kWaitingS, ctx) && ctx.canTimeOut()) {
      return false;
    }

    uint32_t slot = tls_lastDeferredReaderSlot;
    uintptr_t slotValue = 1; // any non-zero value will do

    bool canAlreadyDefer = (state & kMayDefer) != 0;
    bool aboveDeferThreshold =
        (state & kHasS) >= (kNumSharedToStartDeferring - 1) * kIncrHasS;
    bool drainInProgress = ReaderPriority && (state & kBegunE) != 0;
    if (canAlreadyDefer || (aboveDeferThreshold && !drainInProgress)) {
      /* Try using the most recent slot first. */
      slotValue = deferredReader(slot)->load(std::memory_order_relaxed);
      if (slotValue != 0) {
        // starting point for our empty-slot search, can change after
        // calling waitForZeroBits
        uint32_t bestSlot =
            (uint32_t)folly::AccessSpreader<Atom>::current(kMaxDeferredReaders);

        // deferred readers are already enabled, or it is time to
        // enable them if we can find a slot
        for (uint32_t i = 0; i < kDeferredSearchDistance; ++i) {
          slot = bestSlot ^ i;
          assert(slot < kMaxDeferredReaders);
          slotValue = deferredReader(slot)->load(std::memory_order_relaxed);
          if (slotValue == 0) {
            // found empty slot
            tls_lastDeferredReaderSlot = slot;
            break;
          }
        }
      }
    }

    if (slotValue != 0) {
      // not yet deferred, or no empty slots
      if (state_.compare_exchange_strong(state, state + kIncrHasS)) {
        // successfully recorded the read lock inline
        if (token != nullptr) {
          token->type_ = Token::Type::INLINE_SHARED;
        }
        return true;
      }
      // state is updated, try again
      continue;
    }

    // record that deferred readers might be in use if necessary
    if ((state & kMayDefer) == 0) {
      if (!state_.compare_exchange_strong(state, state | kMayDefer)) {
        // keep going if CAS failed because somebody else set the bit
        // for us
        if ((state & (kHasE | kMayDefer)) != kMayDefer) {
          continue;
        }
      }
      // state = state | kMayDefer;
    }

    // try to use the slot
    bool gotSlot = deferredReader(slot)->compare_exchange_strong(
        slotValue,
        token == nullptr ? tokenlessSlotValue() : tokenfulSlotValue());

    // If we got the slot, we need to verify that an exclusive lock
    // didn't happen since we last checked.  If we didn't get the slot we
    // need to recheck state_ anyway to make sure we don't waste too much
    // work.  It is also possible that since we checked state_ someone
    // has acquired and released the write lock, clearing kMayDefer.
    // Both cases are covered by looking for the readers-possible bit,
    // because it is off when the exclusive lock bit is set.
    state = state_.load(std::memory_order_acquire);

    if (!gotSlot) {
      continue;
    }

    if (token == nullptr) {
      tls_lastTokenlessSlot = slot;
    }

    if ((state & kMayDefer) != 0) {
      assert((state & kHasE) == 0);
      // success
      if (token != nullptr) {
        token->type_ = Token::Type::DEFERRED_SHARED;
        token->slot_ = (uint16_t)slot;
      }
      return true;
    }

    // release the slot before retrying
    if (token == nullptr) {
      // We can't rely on slot.  Token-less slot values can be freed by
      // any unlock_shared(), so we need to do the full deferredReader
      // search during unlock.  Unlike unlock_shared(), we can't trust
      // kPrevDefer here.  This deferred lock isn't visible to lock()
      // (that's the whole reason we're undoing it) so there might have
      // subsequently been an unlock() and lock() with no intervening
      // transition to deferred mode.
      if (!tryUnlockTokenlessSharedDeferred()) {
        unlockSharedInline();
      }
    } else {
      if (!tryUnlockSharedDeferred(slot)) {
        unlockSharedInline();
      }
    }

    // We got here not because the lock was unavailable, but because
    // we lost a compare-and-swap.  Try-lock is typically allowed to
    // have spurious failures, but there is no lock efficiency gain
    // from exploiting that freedom here.
  }
}

} // namespace folly
