/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/Likely.h>
#include <folly/detail/Futex.h>
#include <folly/detail/MemoryIdler.h>
#include <folly/portability/Asm.h>
#include <folly/synchronization/WaitOptions.h>
#include <folly/synchronization/detail/Spin.h>

#include <glog/logging.h>

#include <atomic>

namespace folly {

/// SaturatingSemaphore is a flag that allows concurrent posting by
/// multiple posters and concurrent non-destructive waiting by
/// multiple waiters.
///
/// A SaturatingSemaphore allows one or more waiter threads to check,
/// spin, or block, indefinitely or with timeout, for a flag to be set
/// by one or more poster threads. By setting the flag, posters
/// announce to waiters (that may be already waiting or will check
/// the flag in the future) that some condition is true. Posts to an
/// already set flag are idempotent.
///
/// SaturatingSemaphore is called so because it behaves like a hybrid
/// binary/counted _semaphore_ with values zero and infinity, and
/// post() and wait() functions. It is called _saturating_ because one
/// post() is enough to set it to infinity and to satisfy any number
/// of wait()-s. Once set (to infinity) it remains unchanged by
/// subsequent post()-s and wait()-s, until it is reset() back to
/// zero.
///
/// The implementation of SaturatingSemaphore is based on that of
/// Baton. It includes no internal padding, and is only 4 bytes in
/// size. Any alignment or padding to avoid false sharing is up to
/// the user.
/// SaturatingSemaphore differs from Baton as follows:
/// - Baton allows at most one call to post(); this allows any number
///   and concurrently.
/// - Baton allows at most one successful call to any wait variant;
///   this allows any number and concurrently.
///
/// Template parameter:
/// - bool MayBlock: If false, waiting operations spin only. If
///   true, timed and wait operations may block; adds an atomic
///   instruction to the critical path of posters.
///
/// Wait options:
///   WaitOptions contains optional per call setting for spin-max duration:
///   Calls to wait(), try_wait_until(), and try_wait_for() block only after the
///   passage of the spin-max period. The default spin-max duration is 10 usec.
///   The spin-max option is applicable only if MayBlock is true.
///
/// Functions:
///   bool ready():
///     Returns true if the flag is set by a call to post, otherwise false.
///     Equivalent to try_wait, but available on const receivers.
///   void reset();
///     Clears the flag.
///   void post();
///     Sets the flag and wakes all current waiters, i.e., causes all
///     concurrent calls to wait, try_wait_for, and try_wait_until to
///     return.
///   void wait(
///       WaitOptions opt = wait_options());
///     Waits for the flag to be set by a call to post.
///   bool try_wait();
///     Returns true if the flag is set by a call to post, otherwise false.
///   bool try_wait_until(
///       time_point& deadline,
///       WaitOptions& = wait_options());
///     Returns true if the flag is set by a call to post before the
///     deadline, otherwise false.
///   bool try_wait_for(
///       duration&,
///       WaitOptions& = wait_options());
///     Returns true if the flag is set by a call to post before the
///     expiration of the specified duration, otherwise false.
///
/// Usage:
/// @code
/// SaturatingSemaphore</* MayBlock = */ true> f;
/// ASSERT_FALSE(f.try_wait());
/// ASSERT_FALSE(f.try_wait_until(
///     std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
/// ASSERT_FALSE(f.try_wait_until(
///     std::chrono::steady_clock::now() + std::chrono::microseconds(1),
///     f.wait_options().spin_max(std::chrono::microseconds(1))));
/// f.post();
/// f.post();
/// f.wait();
/// f.wait(f.wait_options().spin_max(std::chrono::nanoseconds(100)));
/// ASSERT_TRUE(f.try_wait());
/// ASSERT_TRUE(f.try_wait_until(
///     std::chrono::steady_clock::now() + std::chrono::microseconds(1)));
/// f.wait();
/// f.reset();
/// ASSERT_FALSE(f.try_wait());
/// @endcode

template <bool MayBlock, template <typename> class Atom = std::atomic>
class SaturatingSemaphore {
  detail::Futex<Atom> state_;

  enum State : uint32_t {
    NOTREADY = 0,
    READY = 1,
    BLOCKED = 2,
  };

 public:
  FOLLY_ALWAYS_INLINE static WaitOptions wait_options() {
    return {};
  }

  /** constructor */
  constexpr SaturatingSemaphore() noexcept : state_(NOTREADY) {}

  /** destructor */
  ~SaturatingSemaphore() {}

  /** ready */
  FOLLY_ALWAYS_INLINE bool ready() const noexcept {
    return state_.load(std::memory_order_acquire) == READY;
  }

  /** reset */
  void reset() noexcept {
    state_.store(NOTREADY, std::memory_order_relaxed);
  }

  /** post */
  FOLLY_ALWAYS_INLINE void post() noexcept {
    if (!MayBlock) {
      state_.store(READY, std::memory_order_release);
    } else {
      postFastWaiterMayBlock();
    }
  }

  /** wait */
  FOLLY_ALWAYS_INLINE
  void wait(const WaitOptions& opt = wait_options()) noexcept {
    try_wait_until(std::chrono::steady_clock::time_point::max(), opt);
  }

  /** try_wait */
  FOLLY_ALWAYS_INLINE bool try_wait() noexcept {
    return ready();
  }

  /** try_wait_until */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline,
      const WaitOptions& opt = wait_options()) noexcept {
    if (LIKELY(try_wait())) {
      return true;
    }
    return tryWaitSlow(deadline, opt);
  }

  /** try_wait_for */
  template <class Rep, class Period>
  FOLLY_ALWAYS_INLINE bool try_wait_for(
      const std::chrono::duration<Rep, Period>& duration,
      const WaitOptions& opt = wait_options()) noexcept {
    if (LIKELY(try_wait())) {
      return true;
    }
    auto deadline = std::chrono::steady_clock::now() + duration;
    return tryWaitSlow(deadline, opt);
  }

 private:
  FOLLY_ALWAYS_INLINE void postFastWaiterMayBlock() noexcept {
    uint32_t before = NOTREADY;
    if (LIKELY(state_.compare_exchange_strong(
            before,
            READY,
            std::memory_order_release,
            std::memory_order_relaxed))) {
      return;
    }
    postSlowWaiterMayBlock(before);
  }

  void postSlowWaiterMayBlock(uint32_t before) noexcept; // defined below

  template <typename Clock, typename Duration>
  bool tryWaitSlow(
      const std::chrono::time_point<Clock, Duration>& deadline,
      const WaitOptions& opt) noexcept; // defined below
};

///
/// Member function definitioons
///

/** postSlowWaiterMayBlock */
template <bool MayBlock, template <typename> class Atom>
FOLLY_NOINLINE void SaturatingSemaphore<MayBlock, Atom>::postSlowWaiterMayBlock(
    uint32_t before) noexcept {
  while (true) {
    if (before == NOTREADY) {
      if (state_.compare_exchange_strong(
              before,
              READY,
              std::memory_order_release,
              std::memory_order_relaxed)) {
        return;
      }
    }
    if (before == READY) { // Only if multiple posters
      // The reason for not simply returning (without the following
      // steps) is to prevent the following case:
      //
      //  T1:             T2:             T3:
      //  local1.post();  local2.post();  global.wait();
      //  global.post();  global.post();  global.reset();
      //                                  seq_cst fence
      //                                  local1.try_wait() == true;
      //                                  local2.try_wait() == false;
      //
      // This following steps correspond to T2's global.post(), where
      // global is already posted by T1.
      //
      // The following fence and load guarantee that T3 does not miss
      // T2's prior stores, i.e., local2.post() in this example.
      //
      // The following case is prevented:
      //
      // Starting with local2 == NOTREADY and global == READY
      //
      // T2:                              T3:
      // store READY to local2 // post    store NOTREADY to global // reset
      // seq_cst fenc                     seq_cst fence
      // load READY from global // post   load NOTREADY from local2 // try_wait
      //
      std::atomic_thread_fence(std::memory_order_seq_cst);
      before = state_.load(std::memory_order_relaxed);
      if (before == READY) {
        return;
      }
      continue;
    }
    DCHECK_EQ(before, BLOCKED);
    if (state_.compare_exchange_strong(
            before,
            READY,
            std::memory_order_release,
            std::memory_order_relaxed)) {
      detail::futexWake(&state_);
      return;
    }
  }
}

/** tryWaitSlow */
template <bool MayBlock, template <typename> class Atom>
template <typename Clock, typename Duration>
FOLLY_NOINLINE bool SaturatingSemaphore<MayBlock, Atom>::tryWaitSlow(
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

  auto before = state_.load(std::memory_order_relaxed);
  while (before == NOTREADY &&
         !state_.compare_exchange_strong(
             before,
             BLOCKED,
             std::memory_order_relaxed,
             std::memory_order_relaxed)) {
    if (before == READY) {
      // TODO: move the acquire to the compare_exchange failure load after C++17
      std::atomic_thread_fence(std::memory_order_acquire);
      return true;
    }
  }

  while (true) {
    auto rv = detail::MemoryIdler::futexWaitUntil(state_, BLOCKED, deadline);
    if (rv == detail::FutexResult::TIMEDOUT) {
      assert(deadline != (std::chrono::time_point<Clock, Duration>::max()));
      return false;
    }

    if (ready()) {
      return true;
    }
  }
}

} // namespace folly
