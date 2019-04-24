/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/executors/InlineExecutor.h>
#include <folly/futures/detail/Core.h>

namespace folly {

namespace futures {
namespace detail {
template <typename T>
void coreDetachPromiseMaybeWithResult(Core<T>& core) {
  if (!core.hasResult()) {
    core.setResult(Try<T>(exception_wrapper(BrokenPromise(typeid(T).name()))));
  }
  core.detachPromise();
}
} // namespace detail
} // namespace futures

template <class T>
Promise<T> Promise<T>::makeEmpty() noexcept {
  return Promise<T>(futures::detail::EmptyConstruct{});
}

template <class T>
Promise<T>::Promise() : retrieved_(false), core_(Core::make()) {}

template <class T>
Promise<T>::Promise(Promise<T>&& other) noexcept
    : retrieved_(exchange(other.retrieved_, false)),
      core_(exchange(other.core_, nullptr)) {}

template <class T>
Promise<T>& Promise<T>::operator=(Promise<T>&& other) noexcept {
  detach();
  retrieved_ = exchange(other.retrieved_, false);
  core_ = exchange(other.core_, nullptr);
  return *this;
}

template <class T>
void Promise<T>::throwIfFulfilled() const {
  if (getCore().hasResult()) {
    throw_exception<PromiseAlreadySatisfied>();
  }
}

template <class T>
Promise<T>::Promise(futures::detail::EmptyConstruct) noexcept
    : retrieved_(false), core_(nullptr) {}

template <class T>
Promise<T>::~Promise() {
  detach();
}

template <class T>
void Promise<T>::detach() {
  if (core_) {
    if (!retrieved_) {
      core_->detachFuture();
    }
    futures::detail::coreDetachPromiseMaybeWithResult(*core_);
    core_ = nullptr;
  }
}

template <class T>
SemiFuture<T> Promise<T>::getSemiFuture() {
  if (retrieved_) {
    throw_exception<FutureAlreadyRetrieved>();
  }
  retrieved_ = true;
  return SemiFuture<T>(&getCore());
}

template <class T>
Future<T> Promise<T>::getFuture() {
  // An InlineExecutor approximates the old behaviour of continuations
  // running inine on setting the value of the promise.
  return getSemiFuture().via(&InlineExecutor::instance());
}

template <class T>
template <class E>
typename std::enable_if<std::is_base_of<std::exception, E>::value>::type
Promise<T>::setException(E const& e) {
  setException(make_exception_wrapper<E>(e));
}

template <class T>
void Promise<T>::setException(exception_wrapper ew) {
  setTry(Try<T>(std::move(ew)));
}

template <class T>
template <typename F>
void Promise<T>::setInterruptHandler(F&& fn) {
  getCore().setInterruptHandler(std::forward<F>(fn));
}

template <class T>
void Promise<T>::setTry(Try<T>&& t) {
  throwIfFulfilled();
  core_->setResult(std::move(t));
}

template <class T>
template <class M>
void Promise<T>::setValue(M&& v) {
  static_assert(!std::is_same<T, void>::value, "Use setValue() instead");

  setTry(Try<T>(std::forward<M>(v)));
}

template <class T>
template <class F>
void Promise<T>::setWith(F&& func) {
  throwIfFulfilled();
  setTry(makeTryWith(std::forward<F>(func)));
}

template <class T>
bool Promise<T>::isFulfilled() const noexcept {
  if (core_) {
    return core_->hasResult();
  }
  return true;
}

} // namespace folly
