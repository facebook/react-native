/*
 * Copyright 2018-present Facebook, Inc.
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
#include <experimental/coroutine>

namespace folly {
namespace coro {

/// A baton is a synchronisation primitive for coroutines that allows one
/// coroutine to co_await the baton and suspend until the baton is posted
/// by some other thread via a call to .post().
///
/// The Baton supports being awaited by a single coroutine at a time. If the
/// baton is not ready at the time it is awaited then the awaiting coroutine
/// suspends and is later resumed when some thread calls .post().
///
/// Example usage:
///
///   folly::coro::Baton baton;
///   std::string sharedValue;
///
///   folly::coro::Task<void> consumer()
///   {
///     // Wait until the baton is posted.
///     co_await baton;
///
///     // Now safe to read shared state.
///     std::cout << sharedValue << std::cout;
///   }
///
///   void producer()
///   {
///     // Write to shared state
///     sharedValue = "some result";
///
///     // Publish the value by 'posting' the baton.
///     // This will resume the consumer if it was currently suspended.
///     baton.post();
///   }
class Baton {
 public:
  class WaitOperation;

  /// Initialise the Baton to either the signalled or non-signalled state.
  explicit Baton(bool initiallySignalled = false) noexcept;

  ~Baton();

  /// Query whether the Baton is currently in the signalled state.
  bool ready() const noexcept;

  /// Asynchronously wait for the Baton to enter the signalled state.
  ///
  /// The returned object must be co_awaited from a coroutine. If the Baton
  /// is already signalled then the awaiting coroutine will continue without
  /// suspending. Otherwise, if the Baton is not yet signalled then the
  /// awaiting coroutine will suspend execution and will be resumed when some
  /// thread later calls post().
  ///
  /// You may optionally specify an executor on which to resume executing the
  /// awaiting coroutine if the baton was not already in the signalled state
  /// by chaining a .via(executor) call. If you do not specify an executor then
  /// the behaviour is as if an inline executor was specified.
  /// i.e. the coroutine will be resumed inside the call to .post() on the
  /// thread that next calls .post().
  [[nodiscard]] WaitOperation operator co_await() const noexcept;

  /// Set the Baton to the signalled state if it is not already signalled.
  ///
  /// This will resume any coroutines that are currently suspended waiting
  /// for the Baton inside 'co_await baton.waitAsync()'.
  void post() noexcept;

  /// Reset the baton back to the non-signalled state.
  ///
  /// This method is not safe to be called concurrently with any other
  /// method on the Baton. The caller must ensure that there are no coroutines
  /// currently waiting on the Baton and that there are no threads currently
  /// calling .post() when .reset() is called.
  void reset() noexcept;

  class WaitOperation {
   public:
    explicit WaitOperation(const Baton& baton) noexcept : baton_(baton) {}

    bool await_ready() const noexcept {
      return baton_.ready();
    }

    bool await_suspend(
        std::experimental::coroutine_handle<> awaitingCoroutine) noexcept {
      awaitingCoroutine_ = awaitingCoroutine;
      return baton_.waitImpl(this);
    }

    void await_resume() noexcept {}

   protected:
    friend class Baton;

    const Baton& baton_;
    std::experimental::coroutine_handle<> awaitingCoroutine_;
    WaitOperation* next_;
  };

 private:
  // Try to register the awaiter as
  bool waitImpl(WaitOperation* awaiter) const noexcept;

  // this  - Baton is in the signalled/posted state.
  // other - Baton is not signalled/posted and this is a pointer to the head
  //         of a potentially empty linked-list of Awaiter nodes that were
  //         waiting for the baton to become signalled.
  mutable std::atomic<void*> state_;
};

inline Baton::Baton(bool initiallySignalled) noexcept
    : state_(initiallySignalled ? static_cast<void*>(this) : nullptr) {}

inline bool Baton::ready() const noexcept {
  return state_.load(std::memory_order_acquire) ==
      static_cast<const void*>(this);
}

inline Baton::WaitOperation Baton::operator co_await() const noexcept {
  return Baton::WaitOperation{*this};
}

inline void Baton::reset() noexcept {
  state_.store(nullptr, std::memory_order_relaxed);
}

} // namespace coro
} // namespace folly
