/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/ThreadLocal.h>
#include <folly/experimental/observer/Observer-pre.h>
#include <folly/experimental/observer/detail/Core.h>

namespace folly {
namespace observer {

/**
 * Observer - a library which lets you create objects which track updates of
 * their dependencies and get re-computed when any of the dependencies changes.
 *
 *
 * Given an Observer, you can get a snapshot of the current version of the
 * object it holds:
 *
 *   Observer<int> myObserver = ...;
 *   Snapshot<int> mySnapshot = myObserver.getSnapshot();
 * or simply
 *   Snapshot<int> mySnapshot = *myObserver;
 *
 * Snapshot will hold a view of the object, even if object in the Observer
 * gets updated.
 *
 *
 * What makes Observer powerful is its ability to track updates to other
 * Observers. Imagine we have two separate Observers A and B which hold
 * integers.
 *
 *   Observer<int> observerA = ...;
 *   Observer<int> observerB = ...;
 *
 * To compute a sum of A and B we can create a new Observer which would track
 * updates to A and B and re-compute the sum only when necessary.
 *
 *   Observer<int> sumObserver = makeObserver(
 *       [observerA, observerB] {
 *         int a = **observerA;
 *         int b = **observerB;
 *         return a + b;
 *       });
 *
 *   int sum = **sumObserver;
 *
 * Notice that a + b will be only called when either a or b is changed. Getting
 * a snapshot from sumObserver won't trigger any re-computation.
 *
 *
 * TLObserver is very similar to Observer, but it also keeps a thread-local
 * cache for the observed object.
 *
 *   Observer<int> observer = ...;
 *   TLObserver<int> tlObserver(observer);
 *   auto& snapshot = *tlObserver;
 *
 *
 * See ObserverCreator class if you want to wrap any existing subscription API
 * in an Observer object.
 */
template <typename T>
class Observer;

template <typename T>
class Snapshot {
 public:
  const T& operator*() const {
    return *get();
  }

  const T* operator->() const {
    return get();
  }

  const T* get() const {
    return data_.get();
  }

  std::shared_ptr<const T> getShared() const {
    return data_;
  }

  /**
   * Return the version of the observed object.
   */
  size_t getVersion() const {
    return version_;
  }

 private:
  friend class Observer<T>;

  Snapshot(
      const observer_detail::Core& core,
      std::shared_ptr<const T> data,
      size_t version)
      : data_(std::move(data)), version_(version), core_(&core) {
    DCHECK(data_);
  }

  std::shared_ptr<const T> data_;
  size_t version_;
  const observer_detail::Core* core_;
};

class CallbackHandle {
 public:
  CallbackHandle();
  template <typename T>
  CallbackHandle(
      Observer<T> observer,
      folly::Function<void(Snapshot<T>)> callback);
  CallbackHandle(const CallbackHandle&) = delete;
  CallbackHandle(CallbackHandle&&) = default;
  CallbackHandle& operator=(const CallbackHandle&) = delete;
  CallbackHandle& operator=(CallbackHandle&&) = default;
  ~CallbackHandle();

  // If callback is currently running, waits until it completes.
  // Callback will never be called after cancel() returns.
  void cancel();

 private:
  struct Context;
  std::shared_ptr<Context> context_;
};

template <typename Observable, typename Traits>
class ObserverCreator;

template <typename T>
class Observer {
 public:
  explicit Observer(observer_detail::Core::Ptr core);

  Snapshot<T> getSnapshot() const;
  Snapshot<T> operator*() const {
    return getSnapshot();
  }

  /**
   * Check if we have a newer version of the observed object than the snapshot.
   * Snapshot should have been originally from this Observer.
   */
  bool needRefresh(const Snapshot<T>& snapshot) const {
    DCHECK_EQ(core_.get(), snapshot.core_);
    return snapshot.getVersion() < core_->getVersionLastChange();
  }

  CallbackHandle addCallback(folly::Function<void(Snapshot<T>)> callback) const;

 private:
  template <typename Observable, typename Traits>
  friend class ObserverCreator;

  observer_detail::Core::Ptr core_;
};

/**
 * makeObserver(...) creates a new Observer<T> object given a functor to
 * compute it. The functor can return T or std::shared_ptr<const T>.
 *
 * makeObserver(...) blocks until the initial version of Observer is computed.
 * If creator functor fails (throws or returns a nullptr) during this first
 * call, the exception is re-thrown by makeObserver(...).
 *
 * For all subsequent updates if creator functor fails (throws or returs a
 * nullptr), the Observer (and all its dependents) is not updated.
 */
template <typename F>
Observer<observer_detail::ResultOf<F>> makeObserver(F&& creator);

template <typename F>
Observer<observer_detail::ResultOfUnwrapSharedPtr<F>> makeObserver(F&& creator);

template <typename T>
class TLObserver {
 public:
  explicit TLObserver(Observer<T> observer);
  TLObserver(const TLObserver<T>& other);

  const Snapshot<T>& getSnapshotRef() const;
  const Snapshot<T>& operator*() const {
    return getSnapshotRef();
  }

 private:
  Observer<T> observer_;
  folly::ThreadLocal<Snapshot<T>> snapshot_;
};

/**
 * Same as makeObserver(...), but creates TLObserver.
 */
template <typename T>
TLObserver<T> makeTLObserver(Observer<T> observer) {
  return TLObserver<T>(std::move(observer));
}

template <typename F>
auto makeTLObserver(F&& creator) {
  return makeTLObserver(makeObserver(std::forward<F>(creator)));
}

template <typename T, bool CacheInThreadLocal>
struct ObserverTraits {};

template <typename T>
struct ObserverTraits<T, false> {
  using type = Observer<T>;
};

template <typename T>
struct ObserverTraits<T, true> {
  using type = TLObserver<T>;
};

template <typename T, bool CacheInThreadLocal>
using ObserverT = typename ObserverTraits<T, CacheInThreadLocal>::type;
} // namespace observer
} // namespace folly

#include <folly/experimental/observer/Observer-inl.h>
