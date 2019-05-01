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

#include <folly/IntrusiveList.h>
#include <folly/SpinLock.h>
#include <folly/fibers/GenericBaton.h>

namespace folly {
namespace fibers {

/**
 * @class TimedMutex
 *
 * Like mutex but allows timed_lock in addition to lock and try_lock.
 **/
class TimedMutex {
 public:
  TimedMutex() noexcept {}

  ~TimedMutex() {
    DCHECK(threadWaiters_.empty());
    DCHECK(fiberWaiters_.empty());
    DCHECK(notifiedFiber_ == nullptr);
  }

  TimedMutex(const TimedMutex& rhs) = delete;
  TimedMutex& operator=(const TimedMutex& rhs) = delete;
  TimedMutex(TimedMutex&& rhs) = delete;
  TimedMutex& operator=(TimedMutex&& rhs) = delete;

  // Lock the mutex. The thread / fiber is blocked until the mutex is free
  void lock();

  // Lock the mutex. The thread / fiber will be blocked for a time duration.
  //
  // @return        true if the mutex was locked, false otherwise
  template <typename Rep, typename Period>
  bool timed_lock(const std::chrono::duration<Rep, Period>& duration);

  // Try to obtain lock without blocking the thread or fiber
  bool try_lock();

  // Unlock the mutex and wake up a waiter if there is one
  void unlock();

 private:
  enum class LockResult { SUCCESS, TIMEOUT, STOLEN };

  template <typename WaitFunc>
  LockResult lockHelper(WaitFunc&& waitFunc);

  // represents a waiter waiting for the lock. The waiter waits on the
  // baton until it is woken up by a post or timeout expires.
  struct MutexWaiter {
    Baton baton;
    folly::IntrusiveListHook hook;
  };

  using MutexWaiterList = folly::IntrusiveList<MutexWaiter, &MutexWaiter::hook>;

  folly::SpinLock lock_; //< lock to protect waiter list
  bool locked_ = false; //< is this locked by some thread?
  MutexWaiterList threadWaiters_; //< list of waiters
  MutexWaiterList fiberWaiters_; //< list of waiters
  MutexWaiter* notifiedFiber_{nullptr}; //< Fiber waiter which has been notified
};

/**
 * @class TimedRWMutex
 *
 * A readers-writer lock which allows multiple readers to hold the
 * lock simultaneously or only one writer.
 *
 * NOTE: This is a reader-preferred RWLock i.e. readers are give priority
 * when there are both readers and writers waiting to get the lock.
 **/
template <typename BatonType>
class TimedRWMutex {
 public:
  TimedRWMutex() = default;
  ~TimedRWMutex() = default;

  TimedRWMutex(const TimedRWMutex& rhs) = delete;
  TimedRWMutex& operator=(const TimedRWMutex& rhs) = delete;
  TimedRWMutex(TimedRWMutex&& rhs) = delete;
  TimedRWMutex& operator=(TimedRWMutex&& rhs) = delete;

  // Lock for shared access. The thread / fiber is blocked until the lock
  // can be acquired.
  void read_lock();

  // Like read_lock except the thread /fiber is blocked for a time duration
  // @return        true if locked successfully, false otherwise.
  template <typename Rep, typename Period>
  bool timed_read_lock(const std::chrono::duration<Rep, Period>& duration);

  // Like read_lock but doesn't block the thread / fiber if the lock can't
  // be acquired.
  // @return        true if lock was acquired, false otherwise.
  bool try_read_lock();

  // Obtain an exclusive lock. The thread / fiber is blocked until the lock
  // is available.
  void write_lock();

  // Like write_lock except the thread / fiber is blocked for a time duration
  // @return        true if locked successfully, false otherwise.
  template <typename Rep, typename Period>
  bool timed_write_lock(const std::chrono::duration<Rep, Period>& duration);

  // Like write_lock but doesn't block the thread / fiber if the lock cant be
  // obtained.
  // @return        true if lock was acquired, false otherwise.
  bool try_write_lock();

  // Wrapper for write_lock() for compatibility with Mutex
  void lock() {
    write_lock();
  }

  // Realease the lock. The thread / fiber will wake up all readers if there are
  // any. If there are waiting writers then only one of them will be woken up.
  // NOTE: readers are given priority over writers (see above comment)
  void unlock();

  // Downgrade the lock. The thread / fiber will wake up all readers if there
  // are any.
  void downgrade();

  class ReadHolder {
   public:
    explicit ReadHolder(TimedRWMutex& lock) : lock_(&lock) {
      lock_->read_lock();
    }

    ~ReadHolder() {
      if (lock_) {
        lock_->unlock();
      }
    }

    ReadHolder(const ReadHolder& rhs) = delete;
    ReadHolder& operator=(const ReadHolder& rhs) = delete;
    ReadHolder(ReadHolder&& rhs) = delete;
    ReadHolder& operator=(ReadHolder&& rhs) = delete;

   private:
    TimedRWMutex* lock_;
  };

  class WriteHolder {
   public:
    explicit WriteHolder(TimedRWMutex& lock) : lock_(&lock) {
      lock_->write_lock();
    }

    ~WriteHolder() {
      if (lock_) {
        lock_->unlock();
      }
    }

    WriteHolder(const WriteHolder& rhs) = delete;
    WriteHolder& operator=(const WriteHolder& rhs) = delete;
    WriteHolder(WriteHolder&& rhs) = delete;
    WriteHolder& operator=(WriteHolder&& rhs) = delete;

   private:
    TimedRWMutex* lock_;
  };

 private:
  // invariants that must hold when the lock is not held by anyone
  void verify_unlocked_properties() {
    assert(readers_ == 0);
    assert(read_waiters_.empty());
    assert(write_waiters_.empty());
  }

  // Different states the lock can be in
  enum class State {
    UNLOCKED,
    READ_LOCKED,
    WRITE_LOCKED,
  };

  typedef boost::intrusive::list_member_hook<> MutexWaiterHookType;

  // represents a waiter waiting for the lock.
  struct MutexWaiter {
    BatonType baton;
    MutexWaiterHookType hook;
  };

  typedef boost::intrusive::
      member_hook<MutexWaiter, MutexWaiterHookType, &MutexWaiter::hook>
          MutexWaiterHook;

  typedef boost::intrusive::list<
      MutexWaiter,
      MutexWaiterHook,
      boost::intrusive::constant_time_size<true>>
      MutexWaiterList;

  folly::SpinLock lock_; //< lock protecting the internal state
  // (state_, read_waiters_, etc.)
  State state_ = State::UNLOCKED;

  uint32_t readers_ = 0; //< Number of readers who have the lock

  MutexWaiterList write_waiters_; //< List of thread / fibers waiting for
  //  exclusive access

  MutexWaiterList read_waiters_; //< List of thread / fibers waiting for
  //  shared access
};
} // namespace fibers
} // namespace folly

#include <folly/fibers/TimedMutex-inl.h>
