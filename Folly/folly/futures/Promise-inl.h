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
#include <thread>

#include <folly/futures/FutureException.h>
#include <folly/futures/detail/Core.h>

namespace folly {

template <class T>
Promise<T>::Promise() : retrieved_(false), core_(new detail::Core<T>())
{}

template <class T>
Promise<T>::Promise(Promise<T>&& other) noexcept
    : retrieved_(other.retrieved_), core_(other.core_) {
  other.core_ = nullptr;
  other.retrieved_ = false;
}

template <class T>
Promise<T>& Promise<T>::operator=(Promise<T>&& other) noexcept {
  std::swap(core_, other.core_);
  std::swap(retrieved_, other.retrieved_);
  return *this;
}

template <class T>
void Promise<T>::throwIfFulfilled() {
  if (UNLIKELY(!core_)) {
    throw NoState();
  }
  if (UNLIKELY(core_->ready())) {
    throw PromiseAlreadySatisfied();
  }
}

template <class T>
void Promise<T>::throwIfRetrieved() {
  if (UNLIKELY(retrieved_)) {
    throw FutureAlreadyRetrieved();
  }
}

template <class T>
Promise<T>::~Promise() {
  detach();
}

template <class T>
void Promise<T>::detach() {
  if (core_) {
    if (!retrieved_)
      core_->detachFuture();
    core_->detachPromise();
    core_ = nullptr;
  }
}

template <class T>
Future<T> Promise<T>::getFuture() {
  throwIfRetrieved();
  retrieved_ = true;
  return Future<T>(core_);
}

template <class T>
template <class E>
typename std::enable_if<std::is_base_of<std::exception, E>::value>::type
Promise<T>::setException(E const& e) {
  setException(make_exception_wrapper<E>(e));
}

template <class T>
void Promise<T>::setException(std::exception_ptr const& ep) {
  try {
    std::rethrow_exception(ep);
  } catch (const std::exception& e) {
    setException(exception_wrapper(std::current_exception(), e));
  } catch (...) {
    setException(exception_wrapper(std::current_exception()));
  }
}

template <class T>
void Promise<T>::setException(exception_wrapper ew) {
  throwIfFulfilled();
  core_->setResult(Try<T>(std::move(ew)));
}

template <class T>
void Promise<T>::setInterruptHandler(
  std::function<void(exception_wrapper const&)> fn) {
  core_->setInterruptHandler(std::move(fn));
}

template <class T>
void Promise<T>::setTry(Try<T>&& t) {
  throwIfFulfilled();
  core_->setResult(std::move(t));
}

template <class T>
template <class M>
void Promise<T>::setValue(M&& v) {
  static_assert(!std::is_same<T, void>::value,
                "Use setValue() instead");

  setTry(Try<T>(std::forward<M>(v)));
}

template <class T>
template <class F>
void Promise<T>::setWith(F&& func) {
  throwIfFulfilled();
  setTry(makeTryWith(std::forward<F>(func)));
}

template <class T>
bool Promise<T>::isFulfilled() {
  if (core_) {
    return core_->hasResult();
  }
  return true;
}

}
