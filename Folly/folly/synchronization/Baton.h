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

#include <assert.h>
#include <errno.h>
#include <stdint.h>
#include <atomic>
#include <thread>

#include <folly/Likely.h>
#include <folly/detail/Futex.h>
#include <folly/detail/MemoryIdler.h>
#include <folly/portability/Asm.h>
#include <folly/synchronization/WaitOptions.h>
#include <folly/synchronization/detail/Spin.h>

namespace folly {

/// A Baton allows a thread to block once and be awoken. Captures a
/// single handoff, and during its lifecycle (from construction/reset
/// to destruction/reset) a baton must either be post()ed and wait()ed
/// exactly once each, or not at all.
///
/// Baton includes no internal padding, and is only 4 bytes in size.
/// Any alignment or padding to avoid false sharing is up to the user.
///
/// This is basically a stripped-down semaphore that supports only a
/// single call to sem_post and a single call to sem_wait.
///
/// The non-blocking version (MayBlock == false) provides more speed
/// by using only load acquire and store release operations in the
/// critical path, at the cost of disallowing blocking.
///
/// The current posix semaphore sem_t isn't too bad, but this provides
/// more a bit more speed, inlining, smaller size, a guarantee that
/// the implementation won't change, and compatibility with
/// DeterministicSchedule.  By having a much more restrictive
/// lifecycle we can also add a bunch of assertions that can help to
/// catch race conditions ahead of time.
template <bool MayBlock = true, template <typename> class Atom = std::atomic>
class Baton {
 public:
  FOLLY_ALWAYS_INLINE static WaitOptions wait_options() {
    return {};
  }

  constexpr Baton() noexcept : state_(INIT) {}

  Baton(Baton const&) = delete;
  Baton& operator=(Baton const&) = delete;

  /// It is an error to destroy a Baton on which a thread is currently
  /// wait()ing.  In practice this means that the waiter usually takes
  /// responsibility for destroying the Baton.
  ~Baton() noexcept {
    // The docblock for this function says that it can't be called when
    // there is a concurrent waiter.  We assume a strong version of this
    // requirement in which the caller must _know_ that this is true, they
    // are not allowed to be merely lucky.  If two threads are involved,
    // the destroying thread must actually have synchronized with the
    // waiting thread after wait() returned.  To convey causality the the
    // waiting thread must have used release semantics and the destroying
    // thread must have used acquire semantics for that communication,
    // so we are guaranteed to see the post-wait() value of state_,
    // which cannot be WAITING.
    //
    // Note that since we only care about a single memory location,
    // the only two plausible memory orders here are relaxed and seq_cst.
    assert(state_.load(std::memory_order_relaxed) != WAITING);
  }

  FOLLY_ALWAYS_INLINE bool ready() const noexcept {
    auto s = state_.load(std::memory_order_acquire);
    assert(s == INIT || s == EARLY_DELIVERY);
    return LIKELY(s == EARLY_DELIVERY);
  }

  /// Equivalent to destroying the Baton and creating a new one.  It is
  /// a bug to call this while there is a waiting thread, so in practice
  /// the waiter will be the one that resets the baton.
  void reset() noexcept {
    // See ~Baton for a discussion about why relaxed is okay here
    assert(state_.load(std::memory_order_relaxed) != WAITING);

    // We use a similar argument to justify the use of a relaxed store
    // here.  Since both wait() and post() are required to be called
    // only once per lifetime, no thread can actually call those methods
    // correctly after a reset() unless it synchronizes with the thread
    // that performed the reset().  If a post() or wait() on another thread
    // didn't synchronize, then regardless of what operation we performed
    // here there would be a race on proper use of the Baton's spec
    // (although not on any particular load and store).  Put another way,
    // we don't need to synchronize here because anybody that might rely
    // on such synchronization is required by the baton rules to perform
    // an additional synchronization that has the desired effect anyway.
    //
    // There is actually a similar argument to be made about the
    // constructor, in which the fenceless constructor initialization
    // of state_ is piggybacked on whatever synchronization mechanism
    // distributes knowledge of the Baton's existence
    state_.store(INIT, std::memory_order_relaxed);
  }

  /// Causes wait() to wake up.  For each lifetime of a Baton (where a
  /// lifetime starts at construction or reset() and ends at
  /// destruction or reset()) there can be at most one call to post(),
  /// in the single poster version.  Any thread may call post().
  void post() noexcept {
    if (!MayBlock) {
      /// Spin-only version
      ///
      assert(
          ((1 << state_.load(std::memory_order_relaxed)) &
           ((1 << INIT) | (1 << EARLY_DELIVERY))) != 0);
      state_.store(EARLY_DELIVERY, std::memory_order_release);
      return;
    }

    /// May-block versions
    ///
    uint32_t before = state_.load(std::memory_order_acquire);

    assert(before == INIT || before == WAITING || before == TIMED_OUT);

    if (before == INIT &&
        state_.compare_exchange_strong(
            before,
            EARLY_DELIVERY,
            std::memory_order_release,
            std::memory_order_relaxed)) {
      return;
    }

    assert(before == WAITING || before == TIMED_OUT);

    if (before == TIMED_OUT) {
      return;
    }

    assert(before == WAITING);
    state_.store(LATE_DELIVERY, std::memory_order_release);
    detail::futexWake(&state_, 1);
  }

  /// Waits until post() has been called in the current Baton lifetime.
  /// May be called at most once during a Baton lifetime (construction
  /// |reset until destruction|reset).  If post is called before wait in
  /// the current lifetime then this method returns immediately.
  ///
  /// The restriction that there can be at most one wait() per lifetime
  /// could be relaxed somewhat without any perf or size regressions,
  /// but by making this condition very restrictive we can provide better
  /// checking in debug builds.
  FOLLY_ALWAYS_INLINE
  void wait(const WaitOptions& opt = wait_options()) noexcept {
    if (try_wait()) {
      return;
    }

    auto const deadline = std::chrono::steady_clock::time_point::max();
    tryWaitSlow(deadline, opt);
  }

  /// Similar to wait, but doesn't block the thread if it hasn't been posted.
  ///
  /// try_wait has the following semantics:
  /// - It is ok to call try_wait any number times on the same baton until
  ///   try_wait reports that the baton has been posted.
  /// - It is ok to call timed_wait or wait on the same baton if try_wait
  ///   reports that baton hasn't been posted.
  /// - If try_wait indicates that the baton has been posted, it is invalid to
  ///   call wait, try_wait or timed_wait on the same baton without resetting
  ///
  /// @return       true if baton has been posted, false othewise
  FOLLY_ALWAYS_INLINE bool try_wait() const noexcept {
    return ready();
  }

  /// Similar to wait, but with a timeout. The thread is unblocked if the
  /// timeout expires.
  /// Note: Only a single call to wait/try_wait_for/try_wait_until is allowed
  /// during a baton's life-cycle (from ctor/reset to dtor/reset). In other
  /// words, after try_wait_for the caller can't invoke
  /// wait/try_wait/try_wait_for/try_wait_until
  /// again on the same baton without resetting it.
  ///
  /// @param  timeout       Time until which the thread can block
  /// @return               true if the baton was posted to before timeout,
  ///                       false otherwise
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_wait_for(
      const std::chrono::duration<Rep, Period>& timeout,
      const WaitOptions& opt = wait_options()) noexcept {
    if (try_wait()) {
      return true;
    }

    auto const deadline = std::chrono::steady_clock::now() + timeout;
    return tryWaitSlow(deadline, opt);
  }

  /// Similar to wait, but with a deadline. The thread is unblocked if the
  /// deadline expires.
  /// Note: Only a single call to wait/try_wait_for/try_wait_until is allowed
  /// during a baton's life-cycle (from ctor/reset to dtor/reset). In other
  /// words, after try_wait_until the caller can't invoke
  /// wait/try_wait/try_wait_for/try_wait_until
  /// again on the same baton without resetting it.
  ///
  /// @param  deadline      Time until which the thread can block
  /// @return               true if the baton was posted to before deadline,
  ///                       false otherwise
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline,
      const WaitOptions& opt = wait_options()) noexcept {
    if (try_wait()) {
      return true;
    }

    return tryWaitSlow(deadline, opt);
  }

  /// Alias to try_wait_for. Deprecated.
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool timed_wait(
      const std::chrono::duration<Rep, Period>& timeout) noexcept {
    return try_wait_for(timeout);
  }

  /// Alias to try_wait_until. Deprecated.
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool timed_wait(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    return try_wait_until(deadline);
  }

 private:
  enum State : uint32_t {
    INIT = 0,
    EARLY_DELIVERY = 1,
    WAITING = 2,
    LATE_DELIVERY = 3,
    TIMED_OUT = 4,
  };

  template <typename Clock, typename Duration>
  FOLLY_NOINLINE bool tryWaitSlow(
      const std::chrono::time_point<Clock, Duration>& deadline,
      const WaitOptions& opt) noexcept {
    switch (detail::spin_pause_until(deadline, opt, [=] { return ready(); })) {
      case detail::spin_result::success:
        return true;
      case detail::spin_result::timeout:
        return false;
      case detail::spin_result::advance:
        break;
    }

    if (!MayBlock) {
      switch (detail::spin_yield_until(deadline, [=] { return ready(); })) {
        case detail::spin_result::success:
          return true;
        case detail::spin_result::timeout:
          return false;
        case detail::spin_result::advance:
          break;
      }
    }

    // guess we have to block :(
    uint32_t expected = INIT;
    if (!state_.compare_exchange_strong(
            expected,
            WAITING,
            std::memory_order_relaxed,
            std::memory_order_relaxed)) {
      // CAS failed, last minute reprieve
      assert(expected == EARLY_DELIVERY);
      // TODO: move the acquire to the compare_exchange failure load after C++17
      std::atomic_thread_fence(std::memory_order_acquire);
      return true;
    }

    while (true) {
      auto rv = detail::MemoryIdler::futexWaitUntil(state_, WAITING, deadline);

      // Awoken by the deadline passing.
      if (rv == detail::FutexResult::TIMEDOUT) {
        assert(deadline != (std::chrono::time_point<Clock, Duration>::max()));
        state_.store(TIMED_OUT, std::memory_order_release);
        return false;
      }

      // Probably awoken by a matching wake event, but could also by awoken
      // by an asynchronous signal or by a spurious wakeup.
      //
      // state_ is the truth even if FUTEX_WAIT reported a matching
      // FUTEX_WAKE, since we aren't using type-stable storage and we
      // don't guarantee reuse.  The scenario goes like this: thread
      // A's last touch of a Baton is a call to wake(), which stores
      // LATE_DELIVERY and gets an unlucky context switch before delivering
      // the corresponding futexWake.  Thread B sees LATE_DELIVERY
      // without consuming a futex event, because it calls futexWait
      // with an expected value of WAITING and hence doesn't go to sleep.
      // B returns, so the Baton's memory is reused and becomes another
      // Baton (or a reuse of this one).  B calls futexWait on the new
      // Baton lifetime, then A wakes up and delivers a spurious futexWake
      // to the same memory location.  B's futexWait will then report a
      // consumed wake event even though state_ is still WAITING.
      //
      // It would be possible to add an extra state_ dance to communicate
      // that the futexWake has been sent so that we can be sure to consume
      // it before returning, but that would be a perf and complexity hit.
      uint32_t s = state_.load(std::memory_order_acquire);
      assert(s == WAITING || s == LATE_DELIVERY);
      if (s == LATE_DELIVERY) {
        return true;
      }
    }
  }

  detail::Futex<Atom> state_;
};

} // namespace folly
