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
#include <mutex>
#include <folly/MicroSpinLock.h>

namespace folly { namespace detail {

/// Finite State Machine helper base class.
/// Inherit from this.
/// For best results, use an "enum class" for Enum.
template <class Enum>
class FSM {
private:
  // I am not templatizing this because folly::MicroSpinLock needs to be
  // zero-initialized (or call init) which isn't generic enough for something
  // that behaves like std::mutex. :(
  using Mutex = folly::MicroSpinLock;
  Mutex mutex_ {0};

  // This might not be necessary for all Enum types, e.g. anything
  // that is atomically updated in practice on this CPU and there's no risk
  // of returning a bogus state because of tearing.
  // An optimization would be to use a static conditional on the Enum type.
  std::atomic<Enum> state_;

public:
  explicit FSM(Enum startState) : state_(startState) {}

  Enum getState() const {
    return state_.load(std::memory_order_acquire);
  }

  /// Atomically do a state transition with accompanying action.
  /// The action will see the old state.
  /// @returns true on success, false and action unexecuted otherwise
  template <class F>
  bool updateState(Enum A, Enum B, F const& action) {
    if (!mutex_.try_lock()) {
      mutex_.lock();
    }
    if (state_.load(std::memory_order_acquire) != A) {
      mutex_.unlock();
      return false;
    }
    action();
    state_.store(B, std::memory_order_release);
    mutex_.unlock();
    return true;
  }

  /// Atomically do a state transition with accompanying action. Then do the
  /// unprotected action without holding the lock. If the atomic transition
  /// fails, returns false and neither action was executed.
  ///
  /// This facilitates code like this:
  ///   bool done = false;
  ///   while (!done) {
  ///     switch (getState()) {
  ///     case State::Foo:
  ///       done = updateState(State::Foo, State::Bar,
  ///           [&]{ /* do protected stuff */ },
  ///           [&]{ /* do unprotected stuff */});
  ///       break;
  ///
  /// Which reads nicer than code like this:
  ///   while (true) {
  ///     switch (getState()) {
  ///     case State::Foo:
  ///       if (!updateState(State::Foo, State::Bar,
  ///           [&]{ /* do protected stuff */ })) {
  ///         continue;
  ///       }
  ///       /* do unprotected stuff */
  ///       return; // or otherwise break out of the loop
  ///
  /// The protected action will see the old state, and the unprotected action
  /// will see the new state.
  template <class F1, class F2>
  bool updateState(Enum A, Enum B,
                   F1 const& protectedAction, F2 const& unprotectedAction) {
    bool result = updateState(A, B, protectedAction);
    if (result) {
      unprotectedAction();
    }
    return result;
  }
};

#define FSM_START(fsm) {\
    bool done = false; \
    while (!done) { auto state = fsm.getState(); switch (state) {

#define FSM_UPDATE2(fsm, b, protectedAction, unprotectedAction) \
    done = fsm.updateState(state, (b), (protectedAction), (unprotectedAction));

#define FSM_UPDATE(fsm, b, action) FSM_UPDATE2(fsm, (b), (action), []{})

#define FSM_CASE(fsm, a, b, action) \
  case (a): \
    FSM_UPDATE(fsm, (b), (action)); \
    break;

#define FSM_CASE2(fsm, a, b, protectedAction, unprotectedAction) \
  case (a): \
    FSM_UPDATE2(fsm, (b), (protectedAction), (unprotectedAction)); \
    break;

#define FSM_BREAK done = true; break;
#define FSM_END }}}


}} // folly::detail
