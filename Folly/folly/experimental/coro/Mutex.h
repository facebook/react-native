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
#include <mutex>

namespace folly {
namespace coro {

/// A mutex that can be locked asynchronously using 'co_await'.
///
/// Ownership of the mutex is not tied to any particular thread.
/// This allows the coroutine owning the lock to transition from one thread
/// to another while holding the lock and then perform the unlock() operation
/// on another thread.
///
/// This mutex guarantees a FIFO scheduling algorithm - coroutines acquire the
/// lock in the order that they execute the 'co_await mutex.lockAsync()'
/// operation.
///
/// Note that you cannot use std::scoped_lock/std::lock_guard to acquire the
/// lock as the lock must be acquired with use of 'co_await' which cannot be
/// used in a constructor.
///
/// You can still use the std::scoped_lock/std::lock_guard in conjunction with
/// std::adopt_lock to automatically unlock the mutex when the current scope
/// exits after having locked the mutex using either co_await m.lock_async()
/// or try_lock() .
///
/// You can also attempt to acquire the lock using std::unique_lock in
/// conjunction with std::try_to_lock.
///
/// For example:
///   folly::coro::Mutex m;
///   folly::Executor& executor;
///
///   folly::coro::Task<> asyncScopedLockExample()
///   {
///     std::unique_lock<folly::coro::Mutex> lock{co_await m.co_scoped_lock()};
///     ...
///   }
///
///   folly::coro::Task<> asyncManualLockAndUnlock()
///   {
///     co_await m.co_lock(executor);
///     ...
///     m.unlock();
///   }
///
///   void nonAsyncTryLock()
///   {
///     if (m.try_lock())
///     {
///       // Once the lock is acquired you can pass ownership of the lock to
///       // a std::lock_guard object.
///       std::lock_guard<folly::coro::Mutex> lock{m, std::adopt_lock};
///       ...
///     }
///   }
///
///   void nonAsyncScopedTryLock()
///   {
///     std::unique_lock<folly::coro::Mutex> lock{m, std::try_to_lock};
///     if (lock)
///     {
///       ...
///     }
///   }
class Mutex {
  class ScopedLockOperation;
  class LockOperation;

 public:
  /// Construct a new async mutex that is initially unlocked.
  Mutex() noexcept : state_(unlockedState()), waiters_(nullptr) {}

  Mutex(const Mutex&) = delete;
  Mutex(Mutex&&) = delete;
  Mutex& operator=(const Mutex&) = delete;
  Mutex& operator=(Mutex&&) = delete;

  ~Mutex();

  /// Try to lock the mutex synchronously.
  ///
  /// Returns true if the lock was able to be acquired synchronously, false
  /// if the lock could not be acquired because it was already locked.
  ///
  /// If this method returns true then the caller is responsible for ensuring
  /// that unlock() is called to release the lock.
  bool try_lock() noexcept {
    void* oldValue = unlockedState();
    return state_.compare_exchange_strong(
        oldValue,
        nullptr,
        std::memory_order_acquire,
        std::memory_order_relaxed);
  }

  /// Lock the mutex asynchronously, returning an RAII object that will release
  /// the lock at the end of the scope.
  ///
  /// You must co_await the return value to wait until the lock is acquired.
  ///
  /// Chain a call to .via() to specify the executor to resume on when the lock
  /// is eventually acquired in the case that the lock could not be acquired
  /// synchronously. The awaiting coroutine will continue without suspending
  /// if the lock could be acquired synchronously.
  ///
  /// If you do not specify an executor by calling .via() then the inline
  /// executor is used and the awaiting coroutine is resumed inline inside the
  /// call to .unlock() by the previous lock holder.
  [[nodiscard]] ScopedLockOperation co_scoped_lock() noexcept;

  /// Lock the mutex asynchronously.
  ///
  /// You must co_await the return value to wait until the lock is acquired.
  ///
  /// Chain a call to .via() to specify the executor to resume on when the lock
  /// is eventually acquired in the case that the lock could not be acquired
  /// synchronously. The awaiting coroutine will continue without suspending
  /// if the lock could be acquired synchronously.
  ///
  /// Once the 'co_await m.lockAsync()' operation completes, the awaiting
  /// coroutine is responsible for ensuring that .unlock() is called to release
  /// the lock.
  ///
  /// Consider using scopedLockAsync() instead to obtain a std::scoped_lock
  /// that handles releasing the lock at the end of the scope.
  [[nodiscard]] LockOperation co_lock() noexcept;

  /// Unlock the mutex.
  ///
  /// If there are other coroutines waiting to lock the mutex then this will
  /// schedule the resumption of the next coroutine in the queue.
  void unlock() noexcept;

 private:
  class LockOperation {
   public:
    bool await_ready() noexcept {
      return mutex_.try_lock();
    }

    bool await_suspend(
        std::experimental::coroutine_handle<> awaitingCoroutine) noexcept {
      awaitingCoroutine_ = awaitingCoroutine;
      return mutex_.lockAsyncImpl(this);
    }

    void await_resume() noexcept {}

   protected:
    friend class Mutex;

    explicit LockOperation(Mutex& mutex) noexcept : mutex_(mutex) {}

    Mutex& mutex_;
    std::experimental::coroutine_handle<> awaitingCoroutine_;
    LockOperation* next_;
  };

  class ScopedLockOperation : public LockOperation {
   public:
    std::unique_lock<Mutex> await_resume() noexcept {
      return std::unique_lock<Mutex>{mutex_, std::adopt_lock};
    }

   private:
    friend class Mutex;
    using LockOperation::LockOperation;
  };

  friend class LockOperation;

  // Special value for state_ that indicates the mutex is not locked.
  void* unlockedState() noexcept {
    return this;
  }

  // Try to lock the mutex.
  //
  // Returns true if the lock could not be acquired synchronously and awaiting
  // coroutine should suspend. In this case the coroutine will be resumed later
  // once it acquires the mutex. Returns false if the lock was acquired
  // synchronously and the awaiting coroutine should continue without
  // suspending.
  bool lockAsyncImpl(LockOperation* awaiter);

  // This contains either:
  // - this    => Not locked
  // - nullptr => Locked, no newly queued waiters (ie. empty list of waiters)
  // - other   => Pointer to first LockAwaiterBase* in a linked-list of newly
  //              queued awaiters in LIFO order.
  std::atomic<void*> state_;

  // Linked-list of waiters in FIFO order.
  // Only the current lock holder is allowed to access this member.
  LockOperation* waiters_;
};

inline Mutex::ScopedLockOperation Mutex::co_scoped_lock() noexcept {
  return ScopedLockOperation{*this};
}

inline Mutex::LockOperation Mutex::co_lock() noexcept {
  return LockOperation{*this};
}

} // namespace coro
} // namespace folly
