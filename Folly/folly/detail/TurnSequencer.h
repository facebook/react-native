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

#pragma once

#include <algorithm>
#include <limits>

#include <folly/detail/Futex.h>
#include <folly/portability/Asm.h>
#include <folly/portability/Unistd.h>

#include <glog/logging.h>

namespace folly {

namespace detail {

/// A TurnSequencer allows threads to order their execution according to
/// a monotonically increasing (with wraparound) "turn" value.  The two
/// operations provided are to wait for turn T, and to move to the next
/// turn.  Every thread that is waiting for T must have arrived before
/// that turn is marked completed (for MPMCQueue only one thread waits
/// for any particular turn, so this is trivially true).
///
/// TurnSequencer's state_ holds 26 bits of the current turn (shifted
/// left by 6), along with a 6 bit saturating value that records the
/// maximum waiter minus the current turn.  Wraparound of the turn space
/// is expected and handled.  This allows us to atomically adjust the
/// number of outstanding waiters when we perform a FUTEX_WAKE operation.
/// Compare this strategy to sem_t's separate num_waiters field, which
/// isn't decremented until after the waiting thread gets scheduled,
/// during which time more enqueues might have occurred and made pointless
/// FUTEX_WAKE calls.
///
/// TurnSequencer uses futex() directly.  It is optimized for the
/// case that the highest awaited turn is 32 or less higher than the
/// current turn.  We use the FUTEX_WAIT_BITSET variant, which lets
/// us embed 32 separate wakeup channels in a single futex.  See
/// http://locklessinc.com/articles/futex_cheat_sheet for a description.
///
/// We only need to keep exact track of the delta between the current
/// turn and the maximum waiter for the 32 turns that follow the current
/// one, because waiters at turn t+32 will be awoken at turn t.  At that
/// point they can then adjust the delta using the higher base.  Since we
/// need to encode waiter deltas of 0 to 32 inclusive, we use 6 bits.
/// We actually store waiter deltas up to 63, since that might reduce
/// the number of CAS operations a tiny bit.
///
/// To avoid some futex() calls entirely, TurnSequencer uses an adaptive
/// spin cutoff before waiting.  The overheads (and convergence rate)
/// of separately tracking the spin cutoff for each TurnSequencer would
/// be prohibitive, so the actual storage is passed in as a parameter and
/// updated atomically.  This also lets the caller use different adaptive
/// cutoffs for different operations (read versus write, for example).
/// To avoid contention, the spin cutoff is only updated when requested
/// by the caller.
template <template <typename> class Atom>
struct TurnSequencer {
  explicit TurnSequencer(const uint32_t firstTurn = 0) noexcept
      : state_(encode(firstTurn << kTurnShift, 0)) {}

  /// Returns true iff a call to waitForTurn(turn, ...) won't block
  bool isTurn(const uint32_t turn) const noexcept {
    auto state = state_.load(std::memory_order_acquire);
    return decodeCurrentSturn(state) == (turn << kTurnShift);
  }

  enum class TryWaitResult { SUCCESS, PAST, TIMEDOUT };

  /// See tryWaitForTurn
  /// Requires that `turn` is not a turn in the past.
  void waitForTurn(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff) noexcept {
    const auto ret = tryWaitForTurn(turn, spinCutoff, updateSpinCutoff);
    DCHECK(ret == TryWaitResult::SUCCESS);
  }

  // Internally we always work with shifted turn values, which makes the
  // truncation and wraparound work correctly.  This leaves us bits at
  // the bottom to store the number of waiters.  We call shifted turns
  // "sturns" inside this class.

  /// Blocks the current thread until turn has arrived.  If
  /// updateSpinCutoff is true then this will spin for up to kMaxSpins tries
  /// before blocking and will adjust spinCutoff based on the results,
  /// otherwise it will spin for at most spinCutoff spins.
  /// Returns SUCCESS if the wait succeeded, PAST if the turn is in the past
  /// or TIMEDOUT if the absTime time value is not nullptr and is reached before
  /// the turn arrives
  template <
      class Clock = std::chrono::steady_clock,
      class Duration = typename Clock::duration>
  TryWaitResult tryWaitForTurn(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      const std::chrono::time_point<Clock, Duration>* absTime =
          nullptr) noexcept {
    uint32_t prevThresh = spinCutoff.load(std::memory_order_relaxed);
    const uint32_t effectiveSpinCutoff =
        updateSpinCutoff || prevThresh == 0 ? kMaxSpins : prevThresh;

    uint32_t tries;
    const uint32_t sturn = turn << kTurnShift;
    for (tries = 0;; ++tries) {
      uint32_t state = state_.load(std::memory_order_acquire);
      uint32_t current_sturn = decodeCurrentSturn(state);
      if (current_sturn == sturn) {
        break;
      }

      // wrap-safe version of (current_sturn >= sturn)
      if (sturn - current_sturn >= std::numeric_limits<uint32_t>::max() / 2) {
        // turn is in the past
        return TryWaitResult::PAST;
      }

      // the first effectSpinCutoff tries are spins, after that we will
      // record ourself as a waiter and block with futexWait
      if (tries < effectiveSpinCutoff) {
        asm_volatile_pause();
        continue;
      }

      uint32_t current_max_waiter_delta = decodeMaxWaitersDelta(state);
      uint32_t our_waiter_delta = (sturn - current_sturn) >> kTurnShift;
      uint32_t new_state;
      if (our_waiter_delta <= current_max_waiter_delta) {
        // state already records us as waiters, probably because this
        // isn't our first time around this loop
        new_state = state;
      } else {
        new_state = encode(current_sturn, our_waiter_delta);
        if (state != new_state &&
            !state_.compare_exchange_strong(state, new_state)) {
          continue;
        }
      }
      if (absTime) {
        auto futexResult = detail::futexWaitUntil(
            &state_, new_state, *absTime, futexChannel(turn));
        if (futexResult == FutexResult::TIMEDOUT) {
          return TryWaitResult::TIMEDOUT;
        }
      } else {
        detail::futexWait(&state_, new_state, futexChannel(turn));
      }
    }

    if (updateSpinCutoff || prevThresh == 0) {
      // if we hit kMaxSpins then spinning was pointless, so the right
      // spinCutoff is kMinSpins
      uint32_t target;
      if (tries >= kMaxSpins) {
        target = kMinSpins;
      } else {
        // to account for variations, we allow ourself to spin 2*N when
        // we think that N is actually required in order to succeed
        target = std::min<uint32_t>(
            kMaxSpins, std::max<uint32_t>(kMinSpins, tries * 2));
      }

      if (prevThresh == 0) {
        // bootstrap
        spinCutoff.store(target);
      } else {
        // try once, keep moving if CAS fails.  Exponential moving average
        // with alpha of 7/8
        // Be careful that the quantity we add to prevThresh is signed.
        spinCutoff.compare_exchange_weak(
            prevThresh, prevThresh + int(target - prevThresh) / 8);
      }
    }

    return TryWaitResult::SUCCESS;
  }

  /// Unblocks a thread running waitForTurn(turn + 1)
  void completeTurn(const uint32_t turn) noexcept {
    uint32_t state = state_.load(std::memory_order_acquire);
    while (true) {
      DCHECK(state == encode(turn << kTurnShift, decodeMaxWaitersDelta(state)));
      uint32_t max_waiter_delta = decodeMaxWaitersDelta(state);
      uint32_t new_state = encode(
          (turn + 1) << kTurnShift,
          max_waiter_delta == 0 ? 0 : max_waiter_delta - 1);
      if (state_.compare_exchange_strong(state, new_state)) {
        if (max_waiter_delta != 0) {
          detail::futexWake(
              &state_, std::numeric_limits<int>::max(), futexChannel(turn + 1));
        }
        break;
      }
      // failing compare_exchange_strong updates first arg to the value
      // that caused the failure, so no need to reread state_
    }
  }

  /// Returns the least-most significant byte of the current uncompleted
  /// turn.  The full 32 bit turn cannot be recovered.
  uint8_t uncompletedTurnLSB() const noexcept {
    return uint8_t(state_.load(std::memory_order_acquire) >> kTurnShift);
  }

 private:
  enum : uint32_t {
    /// kTurnShift counts the bits that are stolen to record the delta
    /// between the current turn and the maximum waiter. It needs to be big
    /// enough to record wait deltas of 0 to 32 inclusive.  Waiters more
    /// than 32 in the future will be woken up 32*n turns early (since
    /// their BITSET will hit) and will adjust the waiter count again.
    /// We go a bit beyond and let the waiter count go up to 63, which
    /// is free and might save us a few CAS
    kTurnShift = 6,
    kWaitersMask = (1 << kTurnShift) - 1,

    /// The minimum spin count that we will adaptively select
    kMinSpins = 20,

    /// The maximum spin count that we will adaptively select, and the
    /// spin count that will be used when probing to get a new data point
    /// for the adaptation
    kMaxSpins = 2000,
  };

  /// This holds both the current turn, and the highest waiting turn,
  /// stored as (current_turn << 6) | min(63, max(waited_turn - current_turn))
  Futex<Atom> state_;

  /// Returns the bitmask to pass futexWait or futexWake when communicating
  /// about the specified turn
  uint32_t futexChannel(uint32_t turn) const noexcept {
    return 1u << (turn & 31);
  }

  uint32_t decodeCurrentSturn(uint32_t state) const noexcept {
    return state & ~kWaitersMask;
  }

  uint32_t decodeMaxWaitersDelta(uint32_t state) const noexcept {
    return state & kWaitersMask;
  }

  uint32_t encode(uint32_t currentSturn, uint32_t maxWaiterD) const noexcept {
    return currentSturn | std::min(uint32_t{kWaitersMask}, maxWaiterD);
  }
};

} // namespace detail
} // namespace folly
