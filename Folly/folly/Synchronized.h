/*
 * Copyright 2011-present Facebook, Inc.
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
 * This module implements a Synchronized abstraction useful in
 * mutex-based concurrency.
 *
 * The Synchronized<T, Mutex> class is the primary public API exposed by this
 * module.  See folly/docs/Synchronized.md for a more complete explanation of
 * this class and its benefits.
 */

#pragma once

#include <folly/Function.h>
#include <folly/Likely.h>
#include <folly/LockTraits.h>
#include <folly/Preprocessor.h>
#include <folly/SharedMutex.h>
#include <folly/Traits.h>
#include <folly/Utility.h>
#include <folly/container/Foreach.h>
#include <folly/functional/ApplyTuple.h>
#include <glog/logging.h>

#include <array>
#include <mutex>
#include <tuple>
#include <type_traits>
#include <utility>

namespace folly {

template <class LockedType, class Mutex, class LockPolicy>
class LockedPtrBase;
template <class LockedType, class LockPolicy>
class LockedPtr;

/**
 * Public version of LockInterfaceDispatcher that contains the MutexLevel enum
 * for the passed in mutex type
 *
 * This is decoupled from MutexLevelValueImpl in LockTraits.h because this
 * ensures that a heterogenous mutex with a different API can be used.  For
 * example - if a mutex does not have a lock_shared() method but the
 * LockTraits specialization for it supports a static non member
 * lock_shared(Mutex&) it can be used as a shared mutex and will provide
 * rlock() and wlock() functions.
 */
template <class Mutex>
using MutexLevelValue = detail::MutexLevelValueImpl<
    true,
    LockTraits<Mutex>::is_shared,
    LockTraits<Mutex>::is_upgrade>;

/**
 * SynchronizedBase is a helper parent class for Synchronized<T>.
 *
 * It provides wlock() and rlock() methods for shared mutex types,
 * or lock() methods for purely exclusive mutex types.
 */
template <class Subclass, detail::MutexLevel level>
class SynchronizedBase;

/**
 * SynchronizedBase specialization for shared mutex types.
 *
 * This class provides wlock() and rlock() methods for acquiring the lock and
 * accessing the data.
 */
template <class Subclass>
class SynchronizedBase<Subclass, detail::MutexLevel::SHARED> {
 public:
  using LockedPtr = ::folly::LockedPtr<Subclass, LockPolicyExclusive>;
  using ConstWLockedPtr =
      ::folly::LockedPtr<const Subclass, LockPolicyExclusive>;
  using ConstLockedPtr = ::folly::LockedPtr<const Subclass, LockPolicyShared>;

  using TryWLockedPtr = ::folly::LockedPtr<Subclass, LockPolicyTryExclusive>;
  using ConstTryWLockedPtr =
      ::folly::LockedPtr<const Subclass, LockPolicyTryExclusive>;
  using TryRLockedPtr = ::folly::LockedPtr<const Subclass, LockPolicyTryShared>;

  /**
   * Acquire an exclusive lock, and return a LockedPtr that can be used to
   * safely access the datum.
   *
   * LockedPtr offers operator -> and * to provide access to the datum.
   * The lock will be released when the LockedPtr is destroyed.
   */
  LockedPtr wlock() {
    return LockedPtr(static_cast<Subclass*>(this));
  }

  /**
   * Attempts to acquire the lock in exclusive mode.  If acquisition is
   * unsuccessful, the returned LockedPtr will be null.
   *
   * (Use LockedPtr::operator bool() or LockedPtr::isNull() to check for
   * validity.)
   */
  TryWLockedPtr tryWLock() {
    return TryWLockedPtr{static_cast<Subclass*>(this)};
  }

  /**
   * Acquire a read lock, and return a ConstLockedPtr that can be used to
   * safely access the datum.
   */
  ConstLockedPtr rlock() const {
    return ConstLockedPtr(static_cast<const Subclass*>(this));
  }

  /**
   * Attempts to acquire the lock in shared mode.  If acquisition is
   * unsuccessful, the returned LockedPtr will be null.
   *
   * (Use LockedPtr::operator bool() or LockedPtr::isNull() to check for
   * validity.)
   */
  TryRLockedPtr tryRLock() const {
    return TryRLockedPtr{static_cast<const Subclass*>(this)};
  }

  /**
   * Attempts to acquire the lock, or fails if the timeout elapses first.
   * If acquisition is unsuccessful, the returned LockedPtr will be null.
   *
   * (Use LockedPtr::operator bool() or LockedPtr::isNull() to check for
   * validity.)
   */
  template <class Rep, class Period>
  LockedPtr wlock(const std::chrono::duration<Rep, Period>& timeout) {
    return LockedPtr(static_cast<Subclass*>(this), timeout);
  }

  /**
   * Attempts to acquire the lock, or fails if the timeout elapses first.
   * If acquisition is unsuccessful, the returned LockedPtr will be null.
   *
   * (Use LockedPtr::operator bool() or LockedPtr::isNull() to check for
   * validity.)
   */
  template <class Rep, class Period>
  ConstLockedPtr rlock(
      const std::chrono::duration<Rep, Period>& timeout) const {
    return ConstLockedPtr(static_cast<const Subclass*>(this), timeout);
  }

  /**
   * Invoke a function while holding the lock exclusively.
   *
   * A reference to the datum will be passed into the function as its only
   * argument.
   *
   * This can be used with a lambda argument for easily defining small critical
   * sections in the code.  For example:
   *
   *   auto value = obj.withWLock([](auto& data) {
   *     data.doStuff();
   *     return data.getValue();
   *   });
   */
  template <class Function>
  auto withWLock(Function&& function) {
    return function(*wlock());
  }

  /**
   * Invoke a function while holding the lock exclusively.
   *
   * This is similar to withWLock(), but the function will be passed a
   * LockedPtr rather than a reference to the data itself.
   *
   * This allows scopedUnlock() to be called on the LockedPtr argument if
   * desired.
   */
  template <class Function>
  auto withWLockPtr(Function&& function) {
    return function(wlock());
  }

  /**
   * Invoke a function while holding an the lock in shared mode.
   *
   * A const reference to the datum will be passed into the function as its
   * only argument.
   */
  template <class Function>
  auto withRLock(Function&& function) const {
    return function(*rlock());
  }

  template <class Function>
  auto withRLockPtr(Function&& function) const {
    return function(rlock());
  }
};

/**
 * SynchronizedBase specialization for upgrade mutex types.
 *
 * This class provides all the functionality provided by the SynchronizedBase
 * specialization for shared mutexes and a ulock() method that returns an
 * upgradable lock RAII proxy
 */
template <class Subclass>
class SynchronizedBase<Subclass, detail::MutexLevel::UPGRADE>
    : public SynchronizedBase<Subclass, detail::MutexLevel::SHARED> {
 public:
  using UpgradeLockedPtr = ::folly::LockedPtr<Subclass, LockPolicyUpgrade>;
  using ConstUpgradeLockedPtr =
      ::folly::LockedPtr<const Subclass, LockPolicyUpgrade>;

  using TryUpgradeLockedPtr =
      ::folly::LockedPtr<Subclass, LockPolicyTryUpgrade>;
  using ConstTryUpgradeLockedPtr =
      ::folly::LockedPtr<const Subclass, LockPolicyTryUpgrade>;

  /**
   * Acquire an upgrade lock and return a LockedPtr that can be used to safely
   * access the datum
   *
   * And the const version
   */
  UpgradeLockedPtr ulock() {
    return UpgradeLockedPtr(static_cast<Subclass*>(this));
  }

  /**
   * Attempts to acquire the lock in upgrade mode.  If acquisition is
   * unsuccessful, the returned LockedPtr will be null.
   *
   * (Use LockedPtr::operator bool() or LockedPtr::isNull() to check for
   * validity.)
   */
  TryUpgradeLockedPtr tryULock() {
    return TryUpgradeLockedPtr{static_cast<Subclass*>(this)};
  }

  /**
   * Acquire an upgrade lock and return a LockedPtr that can be used to safely
   * access the datum
   *
   * And the const version
   */
  template <class Rep, class Period>
  UpgradeLockedPtr ulock(const std::chrono::duration<Rep, Period>& timeout) {
    return UpgradeLockedPtr(static_cast<Subclass*>(this), timeout);
  }

  /**
   * Invoke a function while holding the lock.
   *
   * A reference to the datum will be passed into the function as its only
   * argument.
   *
   * This can be used with a lambda argument for easily defining small critical
   * sections in the code.  For example:
   *
   *   auto value = obj.withULock([](auto& data) {
   *     data.doStuff();
   *     return data.getValue();
   *   });
   *
   * This is probably not the function you want.  If the intent is to read the
   * data object and determine whether you should upgrade to a write lock then
   * the withULockPtr() method should be called instead, since it gives access
   * to the LockedPtr proxy (which can be upgraded via the
   * moveFromUpgradeToWrite() method)
   */
  template <class Function>
  auto withULock(Function&& function) {
    return function(*ulock());
  }

  /**
   * Invoke a function while holding the lock exclusively.
   *
   * This is similar to withULock(), but the function will be passed a
   * LockedPtr rather than a reference to the data itself.
   *
   * This allows scopedUnlock() and getUniqueLock() to be called on the
   * LockedPtr argument.
   *
   * This also allows you to upgrade the LockedPtr proxy to a write state so
   * that changes can be made to the underlying data
   */
  template <class Function>
  auto withULockPtr(Function&& function) {
    return function(ulock());
  }
};

/**
 * SynchronizedBase specialization for non-shared mutex types.
 *
 * This class provides lock() methods for acquiring the lock and accessing the
 * data.
 */
template <class Subclass>
class SynchronizedBase<Subclass, detail::MutexLevel::UNIQUE> {
 public:
  using LockedPtr = ::folly::LockedPtr<Subclass, LockPolicyExclusive>;
  using ConstLockedPtr =
      ::folly::LockedPtr<const Subclass, LockPolicyExclusive>;

  using TryLockedPtr = ::folly::LockedPtr<Subclass, LockPolicyTryExclusive>;
  using ConstTryLockedPtr =
      ::folly::LockedPtr<const Subclass, LockPolicyTryExclusive>;

  /**
   * Acquire a lock, and return a LockedPtr that can be used to safely access
   * the datum.
   */
  LockedPtr lock() {
    return LockedPtr(static_cast<Subclass*>(this));
  }

  /**
   * Acquire a lock, and return a ConstLockedPtr that can be used to safely
   * access the datum.
   */
  ConstLockedPtr lock() const {
    return ConstLockedPtr(static_cast<const Subclass*>(this));
  }

  /**
   * Attempts to acquire the lock in exclusive mode.  If acquisition is
   * unsuccessful, the returned LockedPtr will be null.
   *
   * (Use LockedPtr::operator bool() or LockedPtr::isNull() to check for
   * validity.)
   */
  TryLockedPtr tryLock() {
    return TryLockedPtr{static_cast<Subclass*>(this)};
  }
  ConstTryLockedPtr tryLock() const {
    return ConstTryLockedPtr{static_cast<const Subclass*>(this)};
  }

  /**
   * Attempts to acquire the lock, or fails if the timeout elapses first.
   * If acquisition is unsuccessful, the returned LockedPtr will be null.
   */
  template <class Rep, class Period>
  LockedPtr lock(const std::chrono::duration<Rep, Period>& timeout) {
    return LockedPtr(static_cast<Subclass*>(this), timeout);
  }

  /**
   * Attempts to acquire the lock, or fails if the timeout elapses first.
   * If acquisition is unsuccessful, the returned LockedPtr will be null.
   */
  template <class Rep, class Period>
  ConstLockedPtr lock(const std::chrono::duration<Rep, Period>& timeout) const {
    return ConstLockedPtr(static_cast<const Subclass*>(this), timeout);
  }

  /**
   * Invoke a function while holding the lock.
   *
   * A reference to the datum will be passed into the function as its only
   * argument.
   *
   * This can be used with a lambda argument for easily defining small critical
   * sections in the code.  For example:
   *
   *   auto value = obj.withLock([](auto& data) {
   *     data.doStuff();
   *     return data.getValue();
   *   });
   */
  template <class Function>
  auto withLock(Function&& function) {
    return function(*lock());
  }
  template <class Function>
  auto withLock(Function&& function) const {
    return function(*lock());
  }

  /**
   * Invoke a function while holding the lock exclusively.
   *
   * This is similar to withWLock(), but the function will be passed a
   * LockedPtr rather than a reference to the data itself.
   *
   * This allows scopedUnlock() and getUniqueLock() to be called on the
   * LockedPtr argument.
   */
  template <class Function>
  auto withLockPtr(Function&& function) {
    return function(lock());
  }
  template <class Function>
  auto withLockPtr(Function&& function) const {
    return function(lock());
  }
};

/**
 * Synchronized<T> encapsulates an object of type T (a "datum") paired
 * with a mutex. The only way to access the datum is while the mutex
 * is locked, and Synchronized makes it virtually impossible to do
 * otherwise. The code that would access the datum in unsafe ways
 * would look odd and convoluted, thus readily alerting the human
 * reviewer. In contrast, the code that uses Synchronized<T> correctly
 * looks simple and intuitive.
 *
 * The second parameter must be a mutex type.  Any mutex type supported by
 * LockTraits<Mutex> can be used.  By default any class with lock() and
 * unlock() methods will work automatically.  LockTraits can be specialized to
 * teach Synchronized how to use other custom mutex types.  See the
 * documentation in LockTraits.h for additional details.
 *
 * Supported mutexes that work by default include std::mutex,
 * std::recursive_mutex, std::timed_mutex, std::recursive_timed_mutex,
 * folly::SharedMutex, folly::RWSpinLock, and folly::SpinLock.
 * Include LockTraitsBoost.h to get additional LockTraits specializations to
 * support the following boost mutex types: boost::mutex,
 * boost::recursive_mutex, boost::shared_mutex, boost::timed_mutex, and
 * boost::recursive_timed_mutex.
 */
template <class T, class Mutex = SharedMutex>
struct Synchronized : public SynchronizedBase<
                          Synchronized<T, Mutex>,
                          MutexLevelValue<Mutex>::value> {
 private:
  using Base =
      SynchronizedBase<Synchronized<T, Mutex>, MutexLevelValue<Mutex>::value>;
  static constexpr bool nxCopyCtor{
      std::is_nothrow_copy_constructible<T>::value};
  static constexpr bool nxMoveCtor{
      std::is_nothrow_move_constructible<T>::value};

  // used to disable copy construction and assignment
  class NonImplementedType;

 public:
  using LockedPtr = typename Base::LockedPtr;
  using ConstLockedPtr = typename Base::ConstLockedPtr;
  using DataType = T;
  using MutexType = Mutex;

  /**
   * Default constructor leaves both members call their own default
   * constructor.
   */
  Synchronized() = default;

 public:
  /**
   * Copy constructor; deprecated
   *
   * Enabled only when the data type is copy-constructible.
   *
   * Takes a shared-or-exclusive lock on the source mutex while performing the
   * copy-construction of the destination data from the source data. No lock is
   * taken on the destination mutex.
   *
   * May throw even when the data type is is nothrow-copy-constructible because
   * acquiring a lock may throw.
   */
  /* implicit */ Synchronized(typename std::conditional<
                              std::is_copy_constructible<T>::value,
                              const Synchronized&,
                              NonImplementedType>::type rhs) /* may throw */
      : Synchronized(rhs.copy()) {}

  /**
   * Move constructor; deprecated
   *
   * Move-constructs from the source data without locking either the source or
   * the destination mutex.
   *
   * Semantically, assumes that the source object is a true rvalue and therefore
   * that no synchronization is required for accessing it.
   */
  Synchronized(Synchronized&& rhs) noexcept(nxMoveCtor)
      : Synchronized(std::move(rhs.datum_)) {}

  /**
   * Constructor taking a datum as argument copies it. There is no
   * need to lock the constructing object.
   */
  explicit Synchronized(const T& rhs) noexcept(nxCopyCtor) : datum_(rhs) {}

  /**
   * Constructor taking a datum rvalue as argument moves it. Again,
   * there is no need to lock the constructing object.
   */
  explicit Synchronized(T&& rhs) noexcept(nxMoveCtor)
      : datum_(std::move(rhs)) {}

  /**
   * Lets you construct non-movable types in-place. Use the constexpr
   * instance `in_place` as the first argument.
   */
  template <typename... Args>
  explicit Synchronized(in_place_t, Args&&... args)
      : datum_(std::forward<Args>(args)...) {}

  /**
   * Lets you construct the synchronized object and also pass construction
   * parameters to the underlying mutex if desired
   */
  template <typename... DatumArgs, typename... MutexArgs>
  Synchronized(
      std::piecewise_construct_t,
      std::tuple<DatumArgs...> datumArgs,
      std::tuple<MutexArgs...> mutexArgs)
      : Synchronized{std::piecewise_construct,
                     std::move(datumArgs),
                     std::move(mutexArgs),
                     make_index_sequence<sizeof...(DatumArgs)>{},
                     make_index_sequence<sizeof...(MutexArgs)>{}} {}

  /**
   * Copy assignment operator; deprecated
   *
   * Enabled only when the data type is copy-constructible and move-assignable.
   *
   * Move-assigns from a copy of the source data.
   *
   * Takes a shared-or-exclusive lock on the source mutex while copying the
   * source data to a temporary. Takes an exclusive lock on the destination
   * mutex while move-assigning from the temporary.
   *
   * This technique consts an extra temporary but avoids the need to take locks
   * on both mutexes together.
   */
  Synchronized& operator=(typename std::conditional<
                          std::is_copy_constructible<T>::value &&
                              std::is_move_assignable<T>::value,
                          const Synchronized&,
                          NonImplementedType>::type rhs) {
    return *this = rhs.copy();
  }

  /**
   * Move assignment operator; deprecated
   *
   * Takes an exclusive lock on the destination mutex while move-assigning the
   * destination data from the source data. The source mutex is not locked or
   * otherwise accessed.
   *
   * Semantically, assumes that the source object is a true rvalue and therefore
   * that no synchronization is required for accessing it.
   */
  Synchronized& operator=(Synchronized&& rhs) {
    return *this = std::move(rhs.datum_);
  }

  /**
   * Lock object, assign datum.
   */
  Synchronized& operator=(const T& rhs) {
    if (&datum_ != &rhs) {
      auto guard = operator->();
      datum_ = rhs;
    }
    return *this;
  }

  /**
   * Lock object, move-assign datum.
   */
  Synchronized& operator=(T&& rhs) {
    if (&datum_ != &rhs) {
      auto guard = operator->();
      datum_ = std::move(rhs);
    }
    return *this;
  }

  /**
   * Acquire an appropriate lock based on the context.
   *
   * If the mutex is a shared mutex, and the Synchronized instance is const,
   * this acquires a shared lock.  Otherwise this acquires an exclusive lock.
   *
   * In general, prefer using the explicit rlock() and wlock() methods
   * for read-write locks, and lock() for purely exclusive locks.
   *
   * contextualLock() is primarily intended for use in other template functions
   * that do not necessarily know the lock type.
   */
  LockedPtr contextualLock() {
    return LockedPtr(this);
  }
  ConstLockedPtr contextualLock() const {
    return ConstLockedPtr(this);
  }
  template <class Rep, class Period>
  LockedPtr contextualLock(const std::chrono::duration<Rep, Period>& timeout) {
    return LockedPtr(this, timeout);
  }
  template <class Rep, class Period>
  ConstLockedPtr contextualLock(
      const std::chrono::duration<Rep, Period>& timeout) const {
    return ConstLockedPtr(this, timeout);
  }
  /**
   * contextualRLock() acquires a read lock if the mutex type is shared,
   * or a regular exclusive lock for non-shared mutex types.
   *
   * contextualRLock() when you know that you prefer a read lock (if
   * available), even if the Synchronized<T> object itself is non-const.
   */
  ConstLockedPtr contextualRLock() const {
    return ConstLockedPtr(this);
  }
  template <class Rep, class Period>
  ConstLockedPtr contextualRLock(
      const std::chrono::duration<Rep, Period>& timeout) const {
    return ConstLockedPtr(this, timeout);
  }

  /**
   * This accessor offers a LockedPtr. In turn, LockedPtr offers
   * operator-> returning a pointer to T. The operator-> keeps
   * expanding until it reaches a pointer, so syncobj->foo() will lock
   * the object and call foo() against it.
   *
   * NOTE: This API is planned to be deprecated in an upcoming diff.
   * Prefer using lock(), wlock(), or rlock() instead.
   */
  LockedPtr operator->() {
    return LockedPtr(this);
  }

  /**
   * Obtain a ConstLockedPtr.
   *
   * NOTE: This API is planned to be deprecated in an upcoming diff.
   * Prefer using lock(), wlock(), or rlock() instead.
   */
  ConstLockedPtr operator->() const {
    return ConstLockedPtr(this);
  }

  /**
   * Attempts to acquire for a given number of milliseconds. If
   * acquisition is unsuccessful, the returned LockedPtr is nullptr.
   *
   * NOTE: This API is deprecated.  Use lock(), wlock(), or rlock() instead.
   * In the future it will be marked with a deprecation attribute to emit
   * build-time warnings, and then it will be removed entirely.
   */
  LockedPtr timedAcquire(unsigned int milliseconds) {
    return LockedPtr(this, std::chrono::milliseconds(milliseconds));
  }

  /**
   * Attempts to acquire for a given number of milliseconds. If
   * acquisition is unsuccessful, the returned ConstLockedPtr is nullptr.
   *
   * NOTE: This API is deprecated.  Use lock(), wlock(), or rlock() instead.
   * In the future it will be marked with a deprecation attribute to emit
   * build-time warnings, and then it will be removed entirely.
   */
  ConstLockedPtr timedAcquire(unsigned int milliseconds) const {
    return ConstLockedPtr(this, std::chrono::milliseconds(milliseconds));
  }

  /**
   * Swaps with another Synchronized. Protected against
   * self-swap. Only data is swapped. Locks are acquired in increasing
   * address order.
   */
  void swap(Synchronized& rhs) {
    if (this == &rhs) {
      return;
    }
    if (this > &rhs) {
      return rhs.swap(*this);
    }
    auto guard1 = operator->();
    auto guard2 = rhs.operator->();

    using std::swap;
    swap(datum_, rhs.datum_);
  }

  /**
   * Swap with another datum. Recommended because it keeps the mutex
   * held only briefly.
   */
  void swap(T& rhs) {
    LockedPtr guard(this);

    using std::swap;
    swap(datum_, rhs);
  }

  /**
   * Assign another datum and return the original value. Recommended
   * because it keeps the mutex held only briefly.
   */
  T exchange(T&& rhs) {
    swap(rhs);
    return std::move(rhs);
  }

  /**
   * Copies datum to a given target.
   */
  void copy(T* target) const {
    ConstLockedPtr guard(this);
    *target = datum_;
  }

  /**
   * Returns a fresh copy of the datum.
   */
  T copy() const {
    ConstLockedPtr guard(this);
    return datum_;
  }

 private:
  template <class LockedType, class MutexType, class LockPolicy>
  friend class folly::LockedPtrBase;
  template <class LockedType, class LockPolicy>
  friend class folly::LockedPtr;

  /**
   * Helper constructors to enable Synchronized for
   * non-default constructible types T.
   * Guards are created in actual public constructors and are alive
   * for the time required to construct the object
   */
  Synchronized(
      const Synchronized& rhs,
      const ConstLockedPtr& /*guard*/) noexcept(nxCopyCtor)
      : datum_(rhs.datum_) {}

  Synchronized(Synchronized&& rhs, const LockedPtr& /*guard*/) noexcept(
      nxMoveCtor)
      : datum_(std::move(rhs.datum_)) {}

  template <
      typename... DatumArgs,
      typename... MutexArgs,
      std::size_t... IndicesOne,
      std::size_t... IndicesTwo>
  Synchronized(
      std::piecewise_construct_t,
      std::tuple<DatumArgs...> datumArgs,
      std::tuple<MutexArgs...> mutexArgs,
      index_sequence<IndicesOne...>,
      index_sequence<IndicesTwo...>)
      : datum_{std::get<IndicesOne>(std::move(datumArgs))...},
        mutex_{std::get<IndicesTwo>(std::move(mutexArgs))...} {}

  // Synchronized data members
  T datum_;
  mutable Mutex mutex_;
};

template <class SynchronizedType, class LockPolicy>
class ScopedUnlocker;

namespace detail {
/*
 * A helper alias that resolves to "const T" if the template parameter
 * is a const Synchronized<T>, or "T" if the parameter is not const.
 */
template <class SynchronizedType>
using SynchronizedDataType = typename std::conditional<
    std::is_const<SynchronizedType>::value,
    typename SynchronizedType::DataType const,
    typename SynchronizedType::DataType>::type;
/*
 * A helper alias that resolves to a ConstLockedPtr if the template parameter
 * is a const Synchronized<T>, or a LockedPtr if the parameter is not const.
 */
template <class SynchronizedType>
using LockedPtrType = typename std::conditional<
    std::is_const<SynchronizedType>::value,
    typename SynchronizedType::ConstLockedPtr,
    typename SynchronizedType::LockedPtr>::type;

template <
    typename Synchronized,
    typename LockFunc,
    typename TryLockFunc,
    typename... Args>
class SynchronizedLocker {
 public:
  using LockedPtr = invoke_result_t<LockFunc&, Synchronized&, const Args&...>;

  template <typename LockFuncType, typename TryLockFuncType, typename... As>
  SynchronizedLocker(
      Synchronized& sync,
      LockFuncType&& lockFunc,
      TryLockFuncType tryLockFunc,
      As&&... as)
      : synchronized{sync},
        lockFunc_{std::forward<LockFuncType>(lockFunc)},
        tryLockFunc_{std::forward<TryLockFuncType>(tryLockFunc)},
        args_{std::forward<As>(as)...} {}

  auto lock() const {
    auto args = std::tuple<const Args&...>{args_};
    return apply(lockFunc_, std::tuple_cat(std::tie(synchronized), args));
  }
  auto tryLock() const {
    return tryLockFunc_(synchronized);
  }

 private:
  Synchronized& synchronized;
  LockFunc lockFunc_;
  TryLockFunc tryLockFunc_;
  std::tuple<Args...> args_;
};

template <
    typename Synchronized,
    typename LockFunc,
    typename TryLockFunc,
    typename... Args>
auto makeSynchronizedLocker(
    Synchronized& synchronized,
    LockFunc&& lockFunc,
    TryLockFunc&& tryLockFunc,
    Args&&... args) {
  using LockFuncType = std::decay_t<LockFunc>;
  using TryLockFuncType = std::decay_t<TryLockFunc>;
  return SynchronizedLocker<
      Synchronized,
      LockFuncType,
      TryLockFuncType,
      std::decay_t<Args>...>{synchronized,
                             std::forward<LockFunc>(lockFunc),
                             std::forward<TryLockFunc>(tryLockFunc),
                             std::forward<Args>(args)...};
}

/**
 * Acquire locks for multiple Synchronized<T> objects, in a deadlock-safe
 * manner.
 *
 * The function uses the "smart and polite" algorithm from this link
 * http://howardhinnant.github.io/dining_philosophers.html#Polite
 *
 * The gist of the algorithm is that it locks a mutex, then tries to lock the
 * other mutexes in a non-blocking manner.  If all the locks succeed, we are
 * done, if not, we release the locks we have held, yield to allow other
 * threads to continue and then block on the mutex that we failed to acquire.
 *
 * This allows dynamically yielding ownership of all the mutexes but one, so
 * that other threads can continue doing work and locking the other mutexes.
 * See the benchmarks in folly/test/SynchronizedBenchmark.cpp for more.
 */
template <typename... SynchronizedLocker>
auto lock(SynchronizedLocker... lockersIn)
    -> std::tuple<typename SynchronizedLocker::LockedPtr...> {
  // capture the list of lockers as a tuple
  auto lockers = std::forward_as_tuple(lockersIn...);

  // make a list of null LockedPtr instances that we will return to the caller
  auto lockedPtrs = std::tuple<typename SynchronizedLocker::LockedPtr...>{};

  // start by locking the first thing in the list
  std::get<0>(lockedPtrs) = std::get<0>(lockers).lock();
  auto indexLocked = 0;

  while (true) {
    auto couldLockAll = true;

    for_each(lockers, [&](auto& locker, auto index) {
      // if we should try_lock on the current locker then do so
      if (index != indexLocked) {
        auto lockedPtr = locker.tryLock();

        // if we were unable to lock this mutex,
        //
        // 1. release all the locks,
        // 2. yield control to another thread to be nice
        // 3. block on the mutex we failed to lock, acquire the lock
        // 4. break out and set the index of the current mutex to indicate
        //    which mutex we have locked
        if (!lockedPtr) {
          // writing lockedPtrs = decltype(lockedPtrs){} does not compile on
          // gcc, I believe this is a bug D7676798
          lockedPtrs = std::tuple<typename SynchronizedLocker::LockedPtr...>{};

          std::this_thread::yield();
          fetch(lockedPtrs, index) = locker.lock();
          indexLocked = index;
          couldLockAll = false;

          return loop_break;
        }

        // else store the locked mutex in the list we return
        fetch(lockedPtrs, index) = std::move(lockedPtr);
      }

      return loop_continue;
    });

    if (couldLockAll) {
      return lockedPtrs;
    }
  }
}

template <typename Synchronized, typename... Args>
auto wlock(Synchronized& synchronized, Args&&... args) {
  return detail::makeSynchronizedLocker(
      synchronized,
      [](auto& s, auto&&... a) {
        return s.wlock(std::forward<decltype(a)>(a)...);
      },
      [](auto& s) { return s.tryWLock(); },
      std::forward<Args>(args)...);
}
template <typename Synchronized, typename... Args>
auto rlock(Synchronized& synchronized, Args&&... args) {
  return detail::makeSynchronizedLocker(
      synchronized,
      [](auto& s, auto&&... a) {
        return s.rlock(std::forward<decltype(a)>(a)...);
      },
      [](auto& s) { return s.tryRLock(); },
      std::forward<Args>(args)...);
}
template <typename Synchronized, typename... Args>
auto ulock(Synchronized& synchronized, Args&&... args) {
  return detail::makeSynchronizedLocker(
      synchronized,
      [](auto& s, auto&&... a) {
        return s.ulock(std::forward<decltype(a)>(a)...);
      },
      [](auto& s) { return s.tryULock(); },
      std::forward<Args>(args)...);
}
template <typename Synchronized, typename... Args>
auto lock(Synchronized& synchronized, Args&&... args) {
  return detail::makeSynchronizedLocker(
      synchronized,
      [](auto& s, auto&&... a) {
        return s.lock(std::forward<decltype(a)>(a)...);
      },
      [](auto& s) { return s.tryLock(); },
      std::forward<Args>(args)...);
}

} // namespace detail

/**
 * A helper base class for implementing LockedPtr.
 *
 * The main reason for having this as a separate class is so we can specialize
 * it for std::mutex, so we can expose a std::unique_lock to the caller
 * when std::mutex is being used.  This allows callers to use a
 * std::condition_variable with the mutex from a Synchronized<T, std::mutex>.
 *
 * We don't use std::unique_lock with other Mutex types since it makes the
 * LockedPtr class slightly larger, and it makes the logic to support
 * ScopedUnlocker slightly more complicated.  std::mutex is the only one that
 * really seems to benefit from the unique_lock.  std::condition_variable
 * itself only supports std::unique_lock<std::mutex>, so there doesn't seem to
 * be any real benefit to exposing the unique_lock with other mutex types.
 *
 * Note that the SynchronizedType template parameter may or may not be const
 * qualified.
 */
template <class SynchronizedType, class Mutex, class LockPolicy>
class LockedPtrBase {
 public:
  using MutexType = Mutex;
  friend class folly::ScopedUnlocker<SynchronizedType, LockPolicy>;

  /**
   * Friend all instantiations of LockedPtr and LockedPtrBase
   */
  template <typename S, typename L>
  friend class folly::LockedPtr;
  template <typename S, typename M, typename L>
  friend class LockedPtrBase;

  /**
   * Destructor releases.
   */
  ~LockedPtrBase() {
    if (parent_) {
      LockPolicy::unlock(parent_->mutex_);
    }
  }

  /**
   * Unlock the synchronized data.
   *
   * The LockedPtr can no longer be dereferenced after unlock() has been
   * called.  isValid() will return false on an unlocked LockedPtr.
   *
   * unlock() can only be called on a LockedPtr that is valid.
   */
  void unlock() {
    DCHECK(parent_ != nullptr);
    LockPolicy::unlock(parent_->mutex_);
    parent_ = nullptr;
  }

 protected:
  LockedPtrBase() {}
  explicit LockedPtrBase(SynchronizedType* parent) : parent_(parent) {
    DCHECK(parent);
    if (!LockPolicy::lock(parent_->mutex_)) {
      parent_ = nullptr;
    }
  }
  template <class Rep, class Period>
  LockedPtrBase(
      SynchronizedType* parent,
      const std::chrono::duration<Rep, Period>& timeout) {
    if (LockPolicy::try_lock_for(parent->mutex_, timeout)) {
      this->parent_ = parent;
    }
  }
  LockedPtrBase(LockedPtrBase&& rhs) noexcept
      : parent_{exchange(rhs.parent_, nullptr)} {}
  LockedPtrBase& operator=(LockedPtrBase&& rhs) noexcept {
    assignImpl(*this, rhs);
    return *this;
  }

  /**
   * Templated move construct and assignment operators
   *
   * These allow converting LockedPtr types that have the same unlocking
   * policy to each other.  This allows us to write code like
   *
   *  auto wlock = sync.wlock();
   *  wlock.unlock();
   *
   *  auto ulock = sync.ulock();
   *  wlock = ulock.moveFromUpgradeToWrite();
   */
  template <typename LockPolicyType>
  LockedPtrBase(
      LockedPtrBase<SynchronizedType, Mutex, LockPolicyType>&& rhs) noexcept
      : parent_{exchange(rhs.parent_, nullptr)} {}
  template <typename LockPolicyType>
  LockedPtrBase& operator=(
      LockedPtrBase<SynchronizedType, Mutex, LockPolicyType>&& rhs) noexcept {
    assignImpl(*this, rhs);
    return *this;
  }

  /**
   * Implementation for the assignment operator
   */
  template <typename LockPolicyLhs, typename LockPolicyRhs>
  void assignImpl(
      LockedPtrBase<SynchronizedType, Mutex, LockPolicyLhs>& lhs,
      LockedPtrBase<SynchronizedType, Mutex, LockPolicyRhs>& rhs) noexcept {
    if (lhs.parent_) {
      LockPolicy::unlock(lhs.parent_->mutex_);
    }

    lhs.parent_ = exchange(rhs.parent_, nullptr);
  }

  using UnlockerData = SynchronizedType*;

  /**
   * Get a pointer to the Synchronized object from the UnlockerData.
   *
   * In the generic case UnlockerData is just the Synchronized pointer,
   * so we return it as is.  (This function is more interesting in the
   * std::mutex specialization below.)
   */
  static SynchronizedType* getSynchronized(UnlockerData data) {
    return data;
  }

  UnlockerData releaseLock() {
    DCHECK(parent_ != nullptr);
    auto current = parent_;
    parent_ = nullptr;
    LockPolicy::unlock(current->mutex_);
    return current;
  }
  void reacquireLock(UnlockerData&& data) {
    DCHECK(parent_ == nullptr);
    parent_ = data;
    LockPolicy::lock(parent_->mutex_);
  }

  SynchronizedType* parent_ = nullptr;
};

/**
 * LockedPtrBase specialization for use with std::mutex.
 *
 * When std::mutex is used we use a std::unique_lock to hold the mutex.
 * This makes it possible to use std::condition_variable with a
 * Synchronized<T, std::mutex>.
 */
template <class SynchronizedType, class LockPolicy>
class LockedPtrBase<SynchronizedType, std::mutex, LockPolicy> {
 public:
  using MutexType = std::mutex;
  friend class folly::ScopedUnlocker<SynchronizedType, LockPolicy>;

  /**
   * Friend all instantiations of LockedPtr and LockedPtrBase
   */
  template <typename S, typename L>
  friend class folly::LockedPtr;
  template <typename S, typename M, typename L>
  friend class LockedPtrBase;

  /**
   * Destructor releases.
   */
  ~LockedPtrBase() {
    // The std::unique_lock will automatically release the lock when it is
    // destroyed, so we don't need to do anything extra here.
  }

  LockedPtrBase(LockedPtrBase&& rhs) noexcept
      : lock_{std::move(rhs.lock_)}, parent_{exchange(rhs.parent_, nullptr)} {}
  LockedPtrBase& operator=(LockedPtrBase&& rhs) noexcept {
    assignImpl(*this, rhs);
    return *this;
  }

  /**
   * Templated move construct and assignment operators
   *
   * These allow converting LockedPtr types that have the same unlocking
   * policy to each other.
   */
  template <typename LockPolicyType>
  LockedPtrBase(LockedPtrBase<SynchronizedType, std::mutex, LockPolicyType>&&
                    other) noexcept
      : lock_{std::move(other.lock_)},
        parent_{exchange(other.parent_, nullptr)} {}
  template <typename LockPolicyType>
  LockedPtrBase& operator=(
      LockedPtrBase<SynchronizedType, std::mutex, LockPolicyType>&&
          rhs) noexcept {
    assignImpl(*this, rhs);
    return *this;
  }

  /**
   * Implementation for the assignment operator
   */
  template <typename LockPolicyLhs, typename LockPolicyRhs>
  void assignImpl(
      LockedPtrBase<SynchronizedType, std::mutex, LockPolicyLhs>& lhs,
      LockedPtrBase<SynchronizedType, std::mutex, LockPolicyRhs>&
          rhs) noexcept {
    lhs.lock_ = std::move(rhs.lock_);
    lhs.parent_ = exchange(rhs.parent_, nullptr);
  }

  /**
   * Get a reference to the std::unique_lock.
   *
   * This is provided so that callers can use Synchronized<T, std::mutex>
   * with a std::condition_variable.
   *
   * While this API could be used to bypass the normal Synchronized APIs and
   * manually interact with the underlying unique_lock, this is strongly
   * discouraged.
   */
  std::unique_lock<std::mutex>& getUniqueLock() {
    return lock_;
  }

  /**
   * Unlock the synchronized data.
   *
   * The LockedPtr can no longer be dereferenced after unlock() has been
   * called.  isValid() will return false on an unlocked LockedPtr.
   *
   * unlock() can only be called on a LockedPtr that is valid.
   */
  void unlock() {
    DCHECK(parent_ != nullptr);
    lock_.unlock();
    parent_ = nullptr;
  }

 protected:
  LockedPtrBase() {}
  explicit LockedPtrBase(SynchronizedType* parent)
      : lock_{parent->mutex_, std::adopt_lock}, parent_{parent} {
    DCHECK(parent);
    if (!LockPolicy::lock(parent_->mutex_)) {
      parent_ = nullptr;
      lock_.release();
    }
  }

  using UnlockerData =
      std::pair<std::unique_lock<std::mutex>, SynchronizedType*>;

  static SynchronizedType* getSynchronized(const UnlockerData& data) {
    return data.second;
  }

  UnlockerData releaseLock() {
    DCHECK(parent_ != nullptr);
    UnlockerData data(std::move(lock_), parent_);
    parent_ = nullptr;
    data.first.unlock();
    return data;
  }
  void reacquireLock(UnlockerData&& data) {
    lock_ = std::move(data.first);
    lock_.lock();
    parent_ = data.second;
  }

  // The specialization for std::mutex does have to store slightly more
  // state than the default implementation.
  std::unique_lock<std::mutex> lock_;
  SynchronizedType* parent_ = nullptr;
};

/**
 * This class temporarily unlocks a LockedPtr in a scoped manner.
 */
template <class SynchronizedType, class LockPolicy>
class ScopedUnlocker {
 public:
  explicit ScopedUnlocker(LockedPtr<SynchronizedType, LockPolicy>* p)
      : ptr_(p), data_(ptr_->releaseLock()) {}
  ScopedUnlocker(const ScopedUnlocker&) = delete;
  ScopedUnlocker& operator=(const ScopedUnlocker&) = delete;
  ScopedUnlocker(ScopedUnlocker&& other) noexcept
      : ptr_(exchange(other.ptr_, nullptr)), data_(std::move(other.data_)) {}
  ScopedUnlocker& operator=(ScopedUnlocker&& other) = delete;

  ~ScopedUnlocker() {
    if (ptr_) {
      ptr_->reacquireLock(std::move(data_));
    }
  }

  /**
   * Return a pointer to the Synchronized object used by this ScopedUnlocker.
   */
  SynchronizedType* getSynchronized() const {
    return LockedPtr<SynchronizedType, LockPolicy>::getSynchronized(data_);
  }

 private:
  using Data = typename LockedPtr<SynchronizedType, LockPolicy>::UnlockerData;
  LockedPtr<SynchronizedType, LockPolicy>* ptr_{nullptr};
  Data data_;
};

/**
 * A LockedPtr keeps a Synchronized<T> object locked for the duration of
 * LockedPtr's existence.
 *
 * It provides access the datum's members directly by using operator->() and
 * operator*().
 *
 * The LockPolicy parameter controls whether or not the lock is acquired in
 * exclusive or shared mode.
 */
template <class SynchronizedType, class LockPolicy>
class LockedPtr : public LockedPtrBase<
                      SynchronizedType,
                      typename SynchronizedType::MutexType,
                      LockPolicy> {
 private:
  using Base = LockedPtrBase<
      SynchronizedType,
      typename SynchronizedType::MutexType,
      LockPolicy>;
  using UnlockerData = typename Base::UnlockerData;
  // CDataType is the DataType with the appropriate const-qualification
  using CDataType = detail::SynchronizedDataType<SynchronizedType>;
  // Enable only if the unlock policy of the other LockPolicy is the same as
  // ours
  template <typename LockPolicyOther>
  using EnableIfSameUnlockPolicy = std::enable_if_t<std::is_same<
      typename LockPolicy::UnlockPolicy,
      typename LockPolicyOther::UnlockPolicy>::value>;

  // friend other LockedPtr types
  template <typename SynchronizedTypeOther, typename LockPolicyOther>
  friend class LockedPtr;

 public:
  using DataType = typename SynchronizedType::DataType;
  using MutexType = typename SynchronizedType::MutexType;
  using Synchronized = typename std::remove_const<SynchronizedType>::type;
  friend class ScopedUnlocker<SynchronizedType, LockPolicy>;

  /**
   * Creates an uninitialized LockedPtr.
   *
   * Dereferencing an uninitialized LockedPtr is not allowed.
   */
  LockedPtr() {}

  /**
   * Takes a Synchronized<T> and locks it.
   */
  explicit LockedPtr(SynchronizedType* parent) : Base(parent) {}

  /**
   * Takes a Synchronized<T> and attempts to lock it, within the specified
   * timeout.
   *
   * Blocks until the lock is acquired or until the specified timeout expires.
   * If the timeout expired without acquiring the lock, the LockedPtr will be
   * null, and LockedPtr::isNull() will return true.
   */
  template <class Rep, class Period>
  LockedPtr(
      SynchronizedType* parent,
      const std::chrono::duration<Rep, Period>& timeout)
      : Base(parent, timeout) {}

  /**
   * Move constructor.
   */
  LockedPtr(LockedPtr&& rhs) noexcept = default;
  template <
      typename LockPolicyType,
      EnableIfSameUnlockPolicy<LockPolicyType>* = nullptr>
  LockedPtr(LockedPtr<SynchronizedType, LockPolicyType>&& other) noexcept
      : Base{std::move(other)} {}

  /**
   * Move assignment operator.
   */
  LockedPtr& operator=(LockedPtr&& rhs) noexcept = default;
  template <
      typename LockPolicyType,
      EnableIfSameUnlockPolicy<LockPolicyType>* = nullptr>
  LockedPtr& operator=(
      LockedPtr<SynchronizedType, LockPolicyType>&& other) noexcept {
    Base::operator=(std::move(other));
    return *this;
  }

  /*
   * Copy constructor and assignment operator are deleted.
   */
  LockedPtr(const LockedPtr& rhs) = delete;
  LockedPtr& operator=(const LockedPtr& rhs) = delete;

  /**
   * Destructor releases.
   */
  ~LockedPtr() {}

  /**
   * Check if this LockedPtr is uninitialized, or points to valid locked data.
   *
   * This method can be used to check if a timed-acquire operation succeeded.
   * If an acquire operation times out it will result in a null LockedPtr.
   *
   * A LockedPtr is always either null, or holds a lock to valid data.
   * Methods such as scopedUnlock() reset the LockedPtr to null for the
   * duration of the unlock.
   */
  bool isNull() const {
    return this->parent_ == nullptr;
  }

  /**
   * Explicit boolean conversion.
   *
   * Returns !isNull()
   */
  explicit operator bool() const {
    return this->parent_ != nullptr;
  }

  /**
   * Access the locked data.
   *
   * This method should only be used if the LockedPtr is valid.
   */
  CDataType* operator->() const {
    return &this->parent_->datum_;
  }

  /**
   * Access the locked data.
   *
   * This method should only be used if the LockedPtr is valid.
   */
  CDataType& operator*() const {
    return this->parent_->datum_;
  }

  /**
   * Temporarily unlock the LockedPtr, and reset it to null.
   *
   * Returns an helper object that will re-lock and restore the LockedPtr when
   * the helper is destroyed.  The LockedPtr may not be dereferenced for as
   * long as this helper object exists.
   */
  ScopedUnlocker<SynchronizedType, LockPolicy> scopedUnlock() {
    return ScopedUnlocker<SynchronizedType, LockPolicy>(this);
  }

  /***************************************************************************
   * Upgradable lock methods.
   * These are disabled via SFINAE when the mutex is not upgradable
   **************************************************************************/
  /**
   * Move the locked ptr from an upgrade state to an exclusive state.  The
   * current lock is left in a null state.
   */
  template <
      typename SyncType = SynchronizedType,
      typename = typename std::enable_if<
          LockTraits<typename SyncType::MutexType>::is_upgrade>::type>
  LockedPtr<SynchronizedType, LockPolicyFromUpgradeToExclusive>
  moveFromUpgradeToWrite() {
    return LockedPtr<SynchronizedType, LockPolicyFromUpgradeToExclusive>(
        exchange(this->parent_, nullptr));
  }

  /**
   * Move the locked ptr from an exclusive state to an upgrade state.  The
   * current lock is left in a null state.
   */
  template <
      typename SyncType = SynchronizedType,
      typename = typename std::enable_if<
          LockTraits<typename SyncType::MutexType>::is_upgrade>::type>
  LockedPtr<SynchronizedType, LockPolicyFromExclusiveToUpgrade>
  moveFromWriteToUpgrade() {
    return LockedPtr<SynchronizedType, LockPolicyFromExclusiveToUpgrade>(
        exchange(this->parent_, nullptr));
  }

  /**
   * Move the locked ptr from an upgrade state to a shared state.  The
   * current lock is left in a null state.
   */
  template <
      typename SyncType = SynchronizedType,
      typename = typename std::enable_if<
          LockTraits<typename SyncType::MutexType>::is_upgrade>::type>
  LockedPtr<SynchronizedType, LockPolicyFromUpgradeToShared>
  moveFromUpgradeToRead() {
    return LockedPtr<SynchronizedType, LockPolicyFromUpgradeToShared>(
        exchange(this->parent_, nullptr));
  }

  /**
   * Move the locked ptr from an exclusive state to a shared state.  The
   * current lock is left in a null state.
   */
  template <
      typename SyncType = SynchronizedType,
      typename = typename std::enable_if<
          LockTraits<typename SyncType::MutexType>::is_upgrade>::type>
  LockedPtr<SynchronizedType, LockPolicyFromExclusiveToShared>
  moveFromWriteToRead() {
    return LockedPtr<SynchronizedType, LockPolicyFromExclusiveToShared>(
        exchange(this->parent_, nullptr));
  }
};

/**
 * Helper functions that should be passed to either a lock() or synchronized()
 * invocation, these return implementation defined structs that will be used
 * to lock the synchronized instance appropriately.
 *
 *    lock(wlock(one), rlock(two), wlock(three));
 *    synchronized([](auto one, two) { ... }, wlock(one), rlock(two));
 *
 * For example in the above rlock() produces an implementation defined read
 * locking helper instance and wlock() a write locking helper
 *
 * Subsequent arguments passed to these locking helpers, after the first, will
 * be passed by const-ref to the corresponding function on the synchronized
 * instance.  This means that if the function accepts these parameters by
 * value, they will be copied.  Note that it is not necessary that the primary
 * locking function will be invoked at all (for eg.  the implementation might
 * just invoke the try*Lock() method)
 *
 *    // Try to acquire the lock for one second
 *    synchronized([](auto) { ... }, wlock(one, 1s));
 *
 *    // The timed lock acquire might never actually be called, if it is not
 *    // needed by the underlying deadlock avoiding algorithm
 *    synchronized([](auto, auto) { ... }, rlock(one), wlock(two, 1s));
 *
 * Note that the arguments passed to to *lock() calls will be passed by
 * const-ref to the function invocation, as the implementation might use them
 * many times
 */
template <typename D, typename M, typename... Args>
auto wlock(Synchronized<D, M>& synchronized, Args&&... args) {
  return detail::wlock(synchronized, std::forward<Args>(args)...);
}
template <typename Data, typename Mutex, typename... Args>
auto rlock(const Synchronized<Data, Mutex>& synchronized, Args&&... args) {
  return detail::rlock(synchronized, std::forward<Args>(args)...);
}
template <typename D, typename M, typename... Args>
auto ulock(Synchronized<D, M>& synchronized, Args&&... args) {
  return detail::ulock(synchronized, std::forward<Args>(args)...);
}
template <typename D, typename M, typename... Args>
auto lock(Synchronized<D, M>& synchronized, Args&&... args) {
  return detail::lock(synchronized, std::forward<Args>(args)...);
}
template <typename D, typename M, typename... Args>
auto lock(const Synchronized<D, M>& synchronized, Args&&... args) {
  return detail::lock(synchronized, std::forward<Args>(args)...);
}

/**
 * Acquire locks for multiple Synchronized<> objects, in a deadlock-safe
 * manner.
 *
 * Wrap the synchronized instances with the appropriate locking strategy by
 * using one of the four strategies - folly::lock (exclusive acquire for
 * exclusive only mutexes), folly::rlock (shared acquire for shareable
 * mutexes), folly::wlock (exclusive acquire for shareable mutexes) or
 * folly::ulock (upgrade acquire for upgrade mutexes) (see above)
 *
 * The locks will be acquired and the passed callable will be invoked with the
 * LockedPtr instances in the order that they were passed to the function
 */
template <typename Func, typename... SynchronizedLockers>
decltype(auto) synchronized(Func&& func, SynchronizedLockers&&... lockers) {
  return apply(
      std::forward<Func>(func),
      lock(std::forward<SynchronizedLockers>(lockers)...));
}

/**
 * Acquire locks on many lockables or synchronized instances in such a way
 * that the sequence of calls within the function does not cause deadlocks.
 *
 * This can often result in a performance boost as compared to simply
 * acquiring your locks in an ordered manner.  Even for very simple cases.
 * The algorithm tried to adjust to contention by blocking on the mutex it
 * thinks is the best fit, leaving all other mutexes open to be locked by
 * other threads.  See the benchmarks in folly/test/SynchronizedBenchmark.cpp
 * for more
 *
 * This works differently as compared to the locking algorithm in libstdc++
 * and is the recommended way to acquire mutexes in a generic order safe
 * manner.  Performance benchmarks show that this does better than the one in
 * libstdc++ even for the simple cases
 *
 * Usage is the same as std::lock() for arbitrary lockables
 *
 *    folly::lock(one, two, three);
 *
 * To make it work with folly::Synchronized you have to specify how you want
 * the locks to be acquired, use the folly::wlock(), folly::rlock(),
 * folly::ulock() and folly::lock() helpers defined below
 *
 *    auto [one, two] = lock(folly::wlock(a), folly::rlock(b));
 *
 * Note that you can/must avoid the folly:: namespace prefix on the lock()
 * function if you use the helpers, ADL lookup is done to find the lock function
 *
 * This will execute the deadlock avoidance algorithm and acquire a write lock
 * for a and a read lock for b
 */
template <typename LockableOne, typename LockableTwo, typename... Lockables>
void lock(LockableOne& one, LockableTwo& two, Lockables&... lockables) {
  auto locker = [](auto& lockable) {
    using Lockable = std::remove_reference_t<decltype(lockable)>;
    return detail::makeSynchronizedLocker(
        lockable,
        [](auto& l) { return std::unique_lock<Lockable>{l}; },
        [](auto& l) {
          auto lock = std::unique_lock<Lockable>{l, std::defer_lock};
          lock.try_lock();
          return lock;
        });
  };
  auto locks = lock(locker(one), locker(two), locker(lockables)...);

  // release ownership of the locks from the RAII lock wrapper returned by the
  // function above
  for_each(locks, [&](auto& lock) { lock.release(); });
}

/**
 * Acquire locks for multiple Synchronized<T> objects, in a deadlock-safe
 * manner.
 *
 * The locks are acquired in order from lowest address to highest address.
 * (Note that this is not necessarily the same algorithm used by std::lock().)
 * For parameters that are const and support shared locks, a read lock is
 * acquired.  Otherwise an exclusive lock is acquired.
 *
 * use lock() with folly::wlock(), folly::rlock() and folly::ulock() for
 * arbitrary locking without causing a deadlock (as much as possible), with the
 * same effects as std::lock()
 */
template <class Sync1, class Sync2>
std::tuple<detail::LockedPtrType<Sync1>, detail::LockedPtrType<Sync2>>
acquireLocked(Sync1& l1, Sync2& l2) {
  if (static_cast<const void*>(&l1) < static_cast<const void*>(&l2)) {
    auto p1 = l1.contextualLock();
    auto p2 = l2.contextualLock();
    return std::make_tuple(std::move(p1), std::move(p2));
  } else {
    auto p2 = l2.contextualLock();
    auto p1 = l1.contextualLock();
    return std::make_tuple(std::move(p1), std::move(p2));
  }
}

/**
 * A version of acquireLocked() that returns a std::pair rather than a
 * std::tuple, which is easier to use in many places.
 */
template <class Sync1, class Sync2>
std::pair<detail::LockedPtrType<Sync1>, detail::LockedPtrType<Sync2>>
acquireLockedPair(Sync1& l1, Sync2& l2) {
  auto lockedPtrs = acquireLocked(l1, l2);
  return {std::move(std::get<0>(lockedPtrs)),
          std::move(std::get<1>(lockedPtrs))};
}

/************************************************************************
 * NOTE: All APIs below this line will be deprecated in upcoming diffs.
 ************************************************************************/

// Non-member swap primitive
template <class T, class M>
void swap(Synchronized<T, M>& lhs, Synchronized<T, M>& rhs) {
  lhs.swap(rhs);
}

/**
 * Disambiguate the name var by concatenating the line number of the original
 * point of expansion. This avoids shadowing warnings for nested
 * SYNCHRONIZEDs. The name is consistent if used multiple times within
 * another macro.
 * Only for internal use.
 */
#define SYNCHRONIZED_VAR(var) FB_CONCATENATE(SYNCHRONIZED_##var##_, __LINE__)

/**
 * SYNCHRONIZED is the main facility that makes Synchronized<T>
 * helpful. It is a pseudo-statement that introduces a scope where the
 * object is locked. Inside that scope you get to access the unadorned
 * datum.
 *
 * Example:
 *
 * Synchronized<vector<int>> svector;
 * ...
 * SYNCHRONIZED (svector) { ... use svector as a vector<int> ... }
 * or
 * SYNCHRONIZED (v, svector) { ... use v as a vector<int> ... }
 *
 * Refer to folly/docs/Synchronized.md for a detailed explanation and more
 * examples.
 */
#define SYNCHRONIZED(...)                                             \
  FOLLY_PUSH_WARNING                                                  \
  FOLLY_GNU_DISABLE_WARNING("-Wshadow")                               \
  FOLLY_MSVC_DISABLE_WARNING(4189) /* initialized but unreferenced */ \
  FOLLY_MSVC_DISABLE_WARNING(4456) /* declaration hides local */      \
  FOLLY_MSVC_DISABLE_WARNING(4457) /* declaration hides parameter */  \
  FOLLY_MSVC_DISABLE_WARNING(4458) /* declaration hides member */     \
  FOLLY_MSVC_DISABLE_WARNING(4459) /* declaration hides global */     \
  FOLLY_GCC_DISABLE_NEW_SHADOW_WARNINGS                               \
  if (bool SYNCHRONIZED_VAR(state) = false) {                         \
  } else                                                              \
    for (auto SYNCHRONIZED_VAR(lockedPtr) =                           \
             (FB_VA_GLUE(FB_ARG_2_OR_1, (__VA_ARGS__))).operator->(); \
         !SYNCHRONIZED_VAR(state);                                    \
         SYNCHRONIZED_VAR(state) = true)                              \
      for (auto& FB_VA_GLUE(FB_ARG_1, (__VA_ARGS__)) =                \
               *SYNCHRONIZED_VAR(lockedPtr).operator->();             \
           !SYNCHRONIZED_VAR(state);                                  \
           SYNCHRONIZED_VAR(state) = true)                            \
    FOLLY_POP_WARNING

#define TIMED_SYNCHRONIZED(timeout, ...)                                       \
  if (bool SYNCHRONIZED_VAR(state) = false) {                                  \
  } else                                                                       \
    for (auto SYNCHRONIZED_VAR(lockedPtr) =                                    \
             (FB_VA_GLUE(FB_ARG_2_OR_1, (__VA_ARGS__))).timedAcquire(timeout); \
         !SYNCHRONIZED_VAR(state);                                             \
         SYNCHRONIZED_VAR(state) = true)                                       \
      for (auto FB_VA_GLUE(FB_ARG_1, (__VA_ARGS__)) =                          \
               (!SYNCHRONIZED_VAR(lockedPtr)                                   \
                    ? nullptr                                                  \
                    : SYNCHRONIZED_VAR(lockedPtr).operator->());               \
           !SYNCHRONIZED_VAR(state);                                           \
           SYNCHRONIZED_VAR(state) = true)

/**
 * Similar to SYNCHRONIZED, but only uses a read lock.
 */
#define SYNCHRONIZED_CONST(...)            \
  SYNCHRONIZED(                            \
      FB_VA_GLUE(FB_ARG_1, (__VA_ARGS__)), \
      as_const(FB_VA_GLUE(FB_ARG_2_OR_1, (__VA_ARGS__))))

/**
 * Similar to TIMED_SYNCHRONIZED, but only uses a read lock.
 */
#define TIMED_SYNCHRONIZED_CONST(timeout, ...) \
  TIMED_SYNCHRONIZED(                          \
      timeout,                                 \
      FB_VA_GLUE(FB_ARG_1, (__VA_ARGS__)),     \
      as_const(FB_VA_GLUE(FB_ARG_2_OR_1, (__VA_ARGS__))))

/**
 * Synchronizes two Synchronized objects (they may encapsulate
 * different data). Synchronization is done in increasing address of
 * object order, so there is no deadlock risk.
 */
#define SYNCHRONIZED_DUAL(n1, e1, n2, e2)                                      \
  if (bool SYNCHRONIZED_VAR(state) = false) {                                  \
  } else                                                                       \
    for (auto SYNCHRONIZED_VAR(ptrs) = acquireLockedPair(e1, e2);              \
         !SYNCHRONIZED_VAR(state);                                             \
         SYNCHRONIZED_VAR(state) = true)                                       \
      for (auto& n1 = *SYNCHRONIZED_VAR(ptrs).first; !SYNCHRONIZED_VAR(state); \
           SYNCHRONIZED_VAR(state) = true)                                     \
        for (auto& n2 = *SYNCHRONIZED_VAR(ptrs).second;                        \
             !SYNCHRONIZED_VAR(state);                                         \
             SYNCHRONIZED_VAR(state) = true)

} /* namespace folly */
