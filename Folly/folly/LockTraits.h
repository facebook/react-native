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

/**
 * This module provides a traits class for describing properties about mutex
 * classes.
 *
 * This is a primitive for building higher-level abstractions that can work
 * with a variety of mutex classes.  For instance, this allows
 * folly::Synchronized to support a number of different mutex types.
 */
#pragma once

#include <chrono>
#include <type_traits>

// Android, OSX, and Cygwin don't have timed mutexes
#if defined(ANDROID) || defined(__ANDROID__) || defined(__APPLE__) || \
    defined(__CYGWIN__)
#define FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES 0
#else
#define FOLLY_LOCK_TRAITS_HAVE_TIMED_MUTEXES 1
#endif

namespace folly {
namespace detail {

/**
 * An enum to describe the "level" of a mutex.  The supported levels are
 *  Unique - a normal mutex that supports only exclusive locking
 *  Shared - a shared mutex which has shared locking and unlocking functions;
 *  Upgrade - a mutex that has all the methods of the two above along with
 *            support for upgradable locking
 */
enum class MutexLevel { UNIQUE, SHARED, UPGRADE };

/**
 * A template dispatch mechanism that is used to determine the level of the
 * mutex based on its interface.  As decided by LockInterfaceDispatcher.
 */
template <bool is_unique, bool is_shared, bool is_upgrade>
struct MutexLevelValueImpl;
template <>
struct MutexLevelValueImpl<true, false, false> {
  static constexpr MutexLevel value = MutexLevel::UNIQUE;
};
template <>
struct MutexLevelValueImpl<true, true, false> {
  static constexpr MutexLevel value = MutexLevel::SHARED;
};
template <>
struct MutexLevelValueImpl<true, true, true> {
  static constexpr MutexLevel value = MutexLevel::UPGRADE;
};

/**
 * An internal helper class to help identify the interface supported by the
 * mutex.  This is used in conjunction with the above MutexLevel
 * specializations and the LockTraitsImpl to determine what functions are
 * supported by objects of type Mutex
 *
 * The implementation uses SINAE in the return value with trailing return
 * types to figure out what level a mutex is
 */
template <class Mutex>
class LockInterfaceDispatcher {
 private:
  // assert that the mutex type has basic lock and unlock functions
  static_assert(
      std::is_same<decltype(std::declval<Mutex>().lock()), void>::value,
      "The mutex type must support lock and unlock functions");

  // Helper functions for implementing the traits using SFINAE
  template <class T>
  static auto timed_lock_test(T*) -> typename std::is_same<
      decltype(std::declval<T>().try_lock_for(std::chrono::milliseconds(0))),
      bool>::type;
  template <class T>
  static std::false_type timed_lock_test(...);

  template <class T>
  static auto lock_shared_test(T*) -> typename std::
      is_same<decltype(std::declval<T>().lock_shared()), void>::type;
  template <class T>
  static std::false_type lock_shared_test(...);

  template <class T>
  static auto lock_upgrade_test(T*) -> typename std::
      is_same<decltype(std::declval<T>().lock_upgrade()), void>::type;
  template <class T>
  static std::false_type lock_upgrade_test(...);

 public:
  static constexpr bool has_lock_unique = true;
  static constexpr bool has_lock_timed =
      decltype(timed_lock_test<Mutex>(0))::value;
  static constexpr bool has_lock_shared =
      decltype(lock_shared_test<Mutex>(0))::value;
  static constexpr bool has_lock_upgrade =
      decltype(lock_upgrade_test<Mutex>(0))::value;
};

/**
 * LockTraitsImpl is the base that is used to desribe the interface used by
 * different mutex types.  It accepts a MutexLevel argument and a boolean to
 * show whether the mutex is a timed mutex or not.  The implementations are
 * partially specialized and inherit from the other implementations to get
 * similar functionality
 */
template <class Mutex, MutexLevel level, bool is_timed>
struct LockTraitsImpl;

template <class Mutex>
struct LockTraitsImpl<Mutex, MutexLevel::UNIQUE, false> {
  static constexpr bool is_timed{false};
  static constexpr bool is_shared{false};
  static constexpr bool is_upgrade{false};

  /**
   * Acquire the lock exclusively.
   */
  static void lock(Mutex& mutex) {
    mutex.lock();
  }

  /**
   * Release an exclusively-held lock.
   */
  static void unlock(Mutex& mutex) {
    mutex.unlock();
  }
};

/**
 * Higher level mutexes have all the capabilities of the lower levels so
 * inherit
 */
template <class Mutex>
struct LockTraitsImpl<Mutex, MutexLevel::SHARED, false>
    : public LockTraitsImpl<Mutex, MutexLevel::UNIQUE, false> {
  static constexpr bool is_timed{false};
  static constexpr bool is_shared{true};
  static constexpr bool is_upgrade{false};

  /**
   * Acquire the lock in shared (read) mode.
   */
  static void lock_shared(Mutex& mutex) {
    mutex.lock_shared();
  }

  /**
   * Release a lock held in shared mode.
   */
  static void unlock_shared(Mutex& mutex) {
    mutex.unlock_shared();
  }
};

/**
 * The following methods are supported.  There are a few methods
 *
 *  m.lock_upgrade()
 *  m.unlock_upgrade()
 *
 *  m.unlock_upgrade_and_lock()
 *
 *  m.unlock_and_lock_upgrade()
 *  m.unlock_and_lock_shared()
 *  m.unlock_upgrade_and_lock_shared()
 *
 *  m.try_lock_upgrade_for(rel_time)
 *  m.try_unlock_upgrade_and_lock_for(rel_time)
 *
 * Upgrading a shared lock is likely to deadlock when there is more than one
 * thread performing an upgrade.  This applies both to upgrading a shared lock
 * to an upgrade lock and to upgrading a shared lock to a unique lock.
 *
 * Therefore, none of the following methods is supported:
 *  unlock_shared_and_lock_upgrade
 *  unlock_shared_and_lock
 *  try_unlock_shared_and_lock_upgrade
 *  try_unlock_shared_and_lock
 *  try_unlock_shared_and_lock_upgrade_for
 *  try_unlock_shared_and_lock_for
 */
template <class Mutex>
struct LockTraitsImpl<Mutex, MutexLevel::UPGRADE, false>
    : public LockTraitsImpl<Mutex, MutexLevel::SHARED, false> {
  static constexpr bool is_timed{false};
  static constexpr bool is_shared{true};
  static constexpr bool is_upgrade{true};

  /**
   * Acquire the lock in upgradable mode.
   */
  static void lock_upgrade(Mutex& mutex) {
    mutex.lock_upgrade();
  }

  /**
   * Release the lock in upgrade mode
   */
  static void unlock_upgrade(Mutex& mutex) {
    mutex.unlock_upgrade();
  }

  /**
   * Upgrade from an upgradable state to an exclusive state
   */
  static void unlock_upgrade_and_lock(Mutex& mutex) {
    mutex.unlock_upgrade_and_lock();
  }

  /**
   * Downgrade from an exclusive state to an upgrade state
   */
  static void unlock_and_lock_upgrade(Mutex& mutex) {
    mutex.unlock_and_lock_upgrade();
  }

  /**
   * Downgrade from an exclusive state to a shared state
   */
  static void unlock_and_lock_shared(Mutex& mutex) {
    mutex.unlock_and_lock_shared();
  }

  /**
   * Downgrade from an upgrade state to a shared state
   */
  static void unlock_upgrade_and_lock_shared(Mutex& mutex) {
    mutex.unlock_upgrade_and_lock_shared();
  }
};

template <class Mutex>
struct LockTraitsImpl<Mutex, MutexLevel::UNIQUE, true>
    : public LockTraitsImpl<Mutex, MutexLevel::UNIQUE, false> {
  static constexpr bool is_timed{true};
  static constexpr bool is_shared{false};
  static constexpr bool is_upgrade{false};

  /**
   * Acquire the lock exclusively, with a timeout.
   *
   * Returns true or false indicating if the lock was acquired or not.
   */
  template <class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_for(timeout);
  }
};

/**
 * Note that there is no deadly diamond here because all the structs only have
 * static functions and static bools which are going to be overridden by the
 * lowest level implementation
 */
template <class Mutex>
struct LockTraitsImpl<Mutex, MutexLevel::SHARED, true>
    : public LockTraitsImpl<Mutex, MutexLevel::SHARED, false>,
      public LockTraitsImpl<Mutex, MutexLevel::UNIQUE, true> {
  static constexpr bool is_timed{true};
  static constexpr bool is_shared{true};
  static constexpr bool is_upgrade{false};

  /**
   * Acquire the lock exclusively, with a timeout.
   *
   * Returns true or false indicating if the lock was acquired or not.
   */
  template <class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_for(timeout);
  }

  /**
   * Acquire the lock in shared (read) mode, with a timeout.
   *
   * Returns true or false indicating if the lock was acquired or not.
   */
  template <class Rep, class Period>
  static bool try_lock_shared_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_shared_for(timeout);
  }
};

template <class Mutex>
struct LockTraitsImpl<Mutex, MutexLevel::UPGRADE, true>
    : public LockTraitsImpl<Mutex, MutexLevel::UPGRADE, false>,
      public LockTraitsImpl<Mutex, MutexLevel::SHARED, true> {
  static constexpr bool is_timed{true};
  static constexpr bool is_shared{true};
  static constexpr bool is_upgrade{true};

  /**
   * Acquire the lock in upgrade mode with a timeout
   *
   * Returns true or false indicating whether the lock was acquired or not
   */
  template <class Rep, class Period>
  static bool try_lock_upgrade_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_lock_upgrade_for(timeout);
  }

  /**
   * Try to upgrade from an upgradable state to an exclusive state.
   *
   * Returns true or false indicating whether the lock was acquired or not
   */
  template <class Rep, class Period>
  static bool try_unlock_upgrade_and_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return mutex.try_unlock_upgrade_and_lock_for(timeout);
  }
};

} // detail

/**
 * LockTraits describes details about a particular mutex type.
 *
 * The default implementation automatically attempts to detect traits
 * based on the presence of various member functions.
 *
 * You can specialize LockTraits to provide custom behavior for lock
 * classes that do not use the standard method names
 * (lock()/unlock()/lock_shared()/unlock_shared()/try_lock_for())
 *
 *
 * LockTraits contains the following members variables:
 * - static constexpr bool is_shared
 *   True if the lock supports separate shared vs exclusive locking states.
 * - static constexpr bool is_timed
 *   True if the lock supports acquiring the lock with a timeout.
 * - static constexpr bool is_upgrade
 *   True if the lock supports an upgradable state
 *
 * The following static methods always exist:
 * - lock(Mutex& mutex)
 * - unlock(Mutex& mutex)
 *
 * The following static methods may exist, depending on is_shared, is_timed
 * and is_upgrade:
 * - lock_shared()
 *
 * - try_lock_for()
 * - try_lock_shared_for()
 *
 * - lock_upgrade()
 * - unlock_upgrade_and_lock()
 * - unlock_and_lock_upgrade()
 * - unlock_and_lock_shared()
 * - unlock_upgrade_and_lock_shared()
 *
 * - try_lock_upgrade_for()
 * - try_unlock_upgrade_and_lock_for()
 *
 * - unlock_shared()
 * - unlock_upgrade()
 */

/**
 * Decoupling LockTraits and LockTraitsBase so that if people want to fully
 * specialize LockTraits then they can inherit from LockTraitsBase instead
 * of LockTraits with all the same goodies :)
 */
template <class Mutex>
struct LockTraitsBase
    : public detail::LockTraitsImpl<
          Mutex,
          detail::MutexLevelValueImpl<
              detail::LockInterfaceDispatcher<Mutex>::has_lock_unique,
              detail::LockInterfaceDispatcher<Mutex>::has_lock_shared,
              detail::LockInterfaceDispatcher<Mutex>::has_lock_upgrade>::value,
          detail::LockInterfaceDispatcher<Mutex>::has_lock_timed> {};

template <class Mutex>
struct LockTraits : public LockTraitsBase<Mutex> {};

/**
 * If the lock is a shared lock, acquire it in shared mode.
 * Otherwise, for plain (exclusive-only) locks, perform a normal acquire.
 */
template <class Mutex>
typename std::enable_if<LockTraits<Mutex>::is_shared>::type
lock_shared_or_unique(Mutex& mutex) {
  LockTraits<Mutex>::lock_shared(mutex);
}
template <class Mutex>
typename std::enable_if<!LockTraits<Mutex>::is_shared>::type
lock_shared_or_unique(Mutex& mutex) {
  LockTraits<Mutex>::lock(mutex);
}

/**
 * If the lock is a shared lock, try to acquire it in shared mode, for up to
 * the given timeout.  Otherwise, for plain (exclusive-only) locks, try to
 * perform a normal acquire.
 *
 * Returns true if the lock was acquired, or false on time out.
 */
template <class Mutex, class Rep, class Period>
typename std::enable_if<LockTraits<Mutex>::is_shared, bool>::type
try_lock_shared_or_unique_for(
    Mutex& mutex,
    const std::chrono::duration<Rep, Period>& timeout) {
  return LockTraits<Mutex>::try_lock_shared_for(mutex, timeout);
}
template <class Mutex, class Rep, class Period>
typename std::enable_if<!LockTraits<Mutex>::is_shared, bool>::type
try_lock_shared_or_unique_for(
    Mutex& mutex,
    const std::chrono::duration<Rep, Period>& timeout) {
  return LockTraits<Mutex>::try_lock_for(mutex, timeout);
}

/**
 * Release a lock acquired with lock_shared_or_unique()
 */
template <class Mutex>
typename std::enable_if<LockTraits<Mutex>::is_shared>::type
unlock_shared_or_unique(Mutex& mutex) {
  LockTraits<Mutex>::unlock_shared(mutex);
}
template <class Mutex>
typename std::enable_if<!LockTraits<Mutex>::is_shared>::type
unlock_shared_or_unique(Mutex& mutex) {
  LockTraits<Mutex>::unlock(mutex);
}

/*
 * Lock policy classes.
 *
 * These can be used as template parameters to provide compile-time
 * selection over the type of lock operation to perform.
 */

/**
 * A lock policy that performs exclusive lock operations.
 */
struct LockPolicyExclusive {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    LockTraits<Mutex>::lock(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return LockTraits<Mutex>::try_lock_for(mutex, timeout);
  }
  template <class Mutex>
  static void unlock(Mutex& mutex) {
    LockTraits<Mutex>::unlock(mutex);
  }
};

/**
 * A lock policy that performs shared lock operations.
 * This policy only works with shared mutex types.
 */
struct LockPolicyShared {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    LockTraits<Mutex>::lock_shared(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return LockTraits<Mutex>::try_lock_shared_for(mutex, timeout);
  }
  template <class Mutex>
  static void unlock(Mutex& mutex) {
    LockTraits<Mutex>::unlock_shared(mutex);
  }
};

/**
 * A lock policy that performs a shared lock operation if a shared mutex type
 * is given, or a normal exclusive lock operation on non-shared mutex types.
 */
struct LockPolicyShareable {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    lock_shared_or_unique(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return try_lock_shared_or_unique_for(mutex, timeout);
  }
  template <class Mutex>
  static void unlock(Mutex& mutex) {
    unlock_shared_or_unique(mutex);
  }
};

/**
 * A lock policy with the following mapping
 *
 *  lock() -> lock_upgrade()
 *  unlock() -> unlock_upgrade()
 *  try_lock_for -> try_lock_upgrade_for()
 */
struct LockPolicyUpgrade {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    LockTraits<Mutex>::lock_upgrade(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return LockTraits<Mutex>::try_lock_upgrade_for(mutex, timeout);
  }
  template <class Mutex>
  static void unlock(Mutex& mutex) {
    LockTraits<Mutex>::unlock_upgrade(mutex);
  }
};

/*****************************************************************************
 * Policies for all the transitions from possible mutex levels
 ****************************************************************************/
/**
 * A lock policy with the following mapping
 *
 *  lock() -> unlock_upgrade_and_lock()
 *  unlock() -> unlock()
 *  try_lock_for -> try_unlock_upgrade_and_lock_for()
 */
struct LockPolicyFromUpgradeToExclusive : public LockPolicyExclusive {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    LockTraits<Mutex>::unlock_upgrade_and_lock(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>& timeout) {
    return LockTraits<Mutex>::try_unlock_upgrade_and_lock_for(mutex, timeout);
  }
};

/**
 * A lock policy with the following mapping
 *
 *  lock() -> unlock_and_lock_upgrade()
 *  unlock() -> unlock_upgrade()
 *  try_lock_for -> unlock_and_lock_upgrade()
 */
struct LockPolicyFromExclusiveToUpgrade : public LockPolicyUpgrade {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    LockTraits<Mutex>::unlock_and_lock_upgrade(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>&) {
    LockTraits<Mutex>::unlock_and_lock_upgrade(mutex);

    // downgrade should be non blocking and should succeed
    return true;
  }
};

/**
 * A lock policy with the following mapping
 *
 *  lock() -> unlock_upgrade_and_lock_shared()
 *  unlock() -> unlock_shared()
 *  try_lock_for -> unlock_upgrade_and_lock_shared()
 */
struct LockPolicyFromUpgradeToShared : public LockPolicyShared {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    LockTraits<Mutex>::unlock_upgrade_and_lock_shared(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>&) {
    LockTraits<Mutex>::unlock_upgrade_and_lock_shared(mutex);

    // downgrade should be non blocking and should succeed
    return true;
  }
};

/**
 * A lock policy with the following mapping
 *
 *  lock() -> unlock_and_lock_shared()
 *  unlock() -> unlock_shared()
 *  try_lock_for() -> unlock_and_lock_shared()
 */
struct LockPolicyFromExclusiveToShared : public LockPolicyShared {
  template <class Mutex>
  static void lock(Mutex& mutex) {
    LockTraits<Mutex>::unlock_and_lock_shared(mutex);
  }
  template <class Mutex, class Rep, class Period>
  static bool try_lock_for(
      Mutex& mutex,
      const std::chrono::duration<Rep, Period>&) {
    LockTraits<Mutex>::unlock_and_lock_shared(mutex);

    // downgrade should be non blocking and should succeed
    return true;
  }
};

} // folly
