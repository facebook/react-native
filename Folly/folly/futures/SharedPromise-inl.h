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

namespace folly {

template <class T>
SharedPromise<T>::SharedPromise(SharedPromise<T>&& other) noexcept {
  *this = std::move(other);
}

template <class T>
SharedPromise<T>& SharedPromise<T>::operator=(
    SharedPromise<T>&& other) noexcept {
  if (this == &other) {
    return *this;
  }

  // std::lock will perform deadlock avoidance, in case
  // Thread A: p1 = std::move(p2)
  // Thread B: p2 = std::move(p1)
  // race each other
  std::lock(mutex_, other.mutex_);
  std::lock_guard<std::mutex> g1(mutex_, std::adopt_lock);
  std::lock_guard<std::mutex> g2(other.mutex_, std::adopt_lock);

  std::swap(size_, other.size_);
  std::swap(hasValue_, other.hasValue_);
  std::swap(try_, other.try_);
  std::swap(interruptHandler_, other.interruptHandler_);
  std::swap(promises_, other.promises_);

  return *this;
}

template <class T>
size_t SharedPromise<T>::size() {
  std::lock_guard<std::mutex> g(mutex_);
  return size_;
}

template <class T>
SemiFuture<T> SharedPromise<T>::getSemiFuture() {
  std::lock_guard<std::mutex> g(mutex_);
  size_++;
  if (hasValue_) {
    return makeFuture<T>(Try<T>(try_));
  } else {
    promises_.emplace_back();
    if (interruptHandler_) {
      promises_.back().setInterruptHandler(interruptHandler_);
    }
    return promises_.back().getSemiFuture();
  }
}

template <class T>
Future<T> SharedPromise<T>::getFuture() {
  return getSemiFuture().via(&InlineExecutor::instance());
}

template <class T>
template <class E>
typename std::enable_if<std::is_base_of<std::exception, E>::value>::type
SharedPromise<T>::setException(E const& e) {
  setTry(Try<T>(e));
}

template <class T>
void SharedPromise<T>::setException(exception_wrapper ew) {
  setTry(Try<T>(std::move(ew)));
}

template <class T>
void SharedPromise<T>::setInterruptHandler(
    std::function<void(exception_wrapper const&)> fn) {
  std::lock_guard<std::mutex> g(mutex_);
  if (hasValue_) {
    return;
  }
  interruptHandler_ = fn;
  for (auto& p : promises_) {
    p.setInterruptHandler(fn);
  }
}

template <class T>
template <class M>
void SharedPromise<T>::setValue(M&& v) {
  setTry(Try<T>(std::forward<M>(v)));
}

template <class T>
template <class F>
void SharedPromise<T>::setWith(F&& func) {
  setTry(makeTryWith(std::forward<F>(func)));
}

template <class T>
void SharedPromise<T>::setTry(Try<T>&& t) {
  std::vector<Promise<T>> promises;

  {
    std::lock_guard<std::mutex> g(mutex_);
    if (hasValue_) {
      throw_exception<PromiseAlreadySatisfied>();
    }
    hasValue_ = true;
    try_ = std::move(t);
    promises.swap(promises_);
  }

  for (auto& p : promises) {
    p.setTry(Try<T>(try_));
  }
}

template <class T>
bool SharedPromise<T>::isFulfilled() {
  std::lock_guard<std::mutex> g(mutex_);
  return hasValue_;
}

} // namespace folly
