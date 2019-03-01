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

#include <folly/detail/TryDetail.h>
#include <stdexcept>

namespace folly {

template <class T>
Try<T>::Try(Try<T>&& t) noexcept : contains_(t.contains_) {
  if (contains_ == Contains::VALUE) {
    new (&value_)T(std::move(t.value_));
  } else if (contains_ == Contains::EXCEPTION) {
    new (&e_)std::unique_ptr<exception_wrapper>(std::move(t.e_));
  }
}

template <class T>
template <class T2>
Try<T>::Try(typename std::enable_if<std::is_same<Unit, T2>::value,
                                    Try<void> const&>::type t)
    : contains_(Contains::NOTHING) {
  if (t.hasValue()) {
    contains_ = Contains::VALUE;
    new (&value_) T();
  } else if (t.hasException()) {
    contains_ = Contains::EXCEPTION;
    new (&e_) std::unique_ptr<exception_wrapper>(
        folly::make_unique<exception_wrapper>(t.exception()));
  }
}

template <class T>
Try<T>& Try<T>::operator=(Try<T>&& t) noexcept {
  if (this == &t) {
    return *this;
  }

  this->~Try();
  contains_ = t.contains_;
  if (contains_ == Contains::VALUE) {
    new (&value_)T(std::move(t.value_));
  } else if (contains_ == Contains::EXCEPTION) {
    new (&e_)std::unique_ptr<exception_wrapper>(std::move(t.e_));
  }
  return *this;
}

template <class T>
Try<T>::Try(const Try<T>& t) {
  static_assert(
      std::is_copy_constructible<T>::value,
      "T must be copyable for Try<T> to be copyable");
  contains_ = t.contains_;
  if (contains_ == Contains::VALUE) {
    new (&value_)T(t.value_);
  } else if (contains_ == Contains::EXCEPTION) {
    new (&e_)std::unique_ptr<exception_wrapper>();
    e_ = folly::make_unique<exception_wrapper>(*(t.e_));
  }
}

template <class T>
Try<T>& Try<T>::operator=(const Try<T>& t) {
  static_assert(
      std::is_copy_constructible<T>::value,
      "T must be copyable for Try<T> to be copyable");
  this->~Try();
  contains_ = t.contains_;
  if (contains_ == Contains::VALUE) {
    new (&value_)T(t.value_);
  } else if (contains_ == Contains::EXCEPTION) {
    new (&e_)std::unique_ptr<exception_wrapper>();
    e_ = folly::make_unique<exception_wrapper>(*(t.e_));
  }
  return *this;
}

template <class T>
Try<T>::~Try() {
  if (LIKELY(contains_ == Contains::VALUE)) {
    value_.~T();
  } else if (UNLIKELY(contains_ == Contains::EXCEPTION)) {
    e_.~unique_ptr<exception_wrapper>();
  }
}

template <class T>
T& Try<T>::value() & {
  throwIfFailed();
  return value_;
}

template <class T>
T&& Try<T>::value() && {
  throwIfFailed();
  return std::move(value_);
}

template <class T>
const T& Try<T>::value() const & {
  throwIfFailed();
  return value_;
}

template <class T>
void Try<T>::throwIfFailed() const {
  if (contains_ != Contains::VALUE) {
    if (contains_ == Contains::EXCEPTION) {
      e_->throwException();
    } else {
      throw UsingUninitializedTry();
    }
  }
}

void Try<void>::throwIfFailed() const {
  if (!hasValue_) {
    e_->throwException();
  }
}

template <typename T>
inline T moveFromTry(Try<T>& t) {
  return std::move(t.value());
}

inline void moveFromTry(Try<void>& t) {
  return t.value();
}

template <typename F>
typename std::enable_if<
  !std::is_same<typename std::result_of<F()>::type, void>::value,
  Try<typename std::result_of<F()>::type>>::type
makeTryWith(F&& f) {
  typedef typename std::result_of<F()>::type ResultType;
  try {
    return Try<ResultType>(f());
  } catch (std::exception& e) {
    return Try<ResultType>(exception_wrapper(std::current_exception(), e));
  } catch (...) {
    return Try<ResultType>(exception_wrapper(std::current_exception()));
  }
}

template <typename F>
typename std::enable_if<
  std::is_same<typename std::result_of<F()>::type, void>::value,
  Try<void>>::type
makeTryWith(F&& f) {
  try {
    f();
    return Try<void>();
  } catch (std::exception& e) {
    return Try<void>(exception_wrapper(std::current_exception(), e));
  } catch (...) {
    return Try<void>(exception_wrapper(std::current_exception()));
  }
}

template <typename... Ts>
std::tuple<Ts...> unwrapTryTuple(std::tuple<folly::Try<Ts>...>&& ts) {
  return detail::TryTuple<Ts...>::unwrap(
      std::forward<std::tuple<folly::Try<Ts>...>>(ts));
}

} // folly
