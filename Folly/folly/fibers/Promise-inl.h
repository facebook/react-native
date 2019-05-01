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
#include <folly/fibers/Baton.h>

namespace folly {
namespace fibers {

template <class T, class BatonT>
Promise<T, BatonT>::Promise(folly::Try<T>& value, BatonT& baton)
    : value_(&value), baton_(&baton) {}

template <class T, class BatonT>
Promise<T, BatonT>::Promise(Promise&& other) noexcept
    : value_(other.value_), baton_(other.baton_) {
  other.value_ = nullptr;
  other.baton_ = nullptr;
}

template <class T, class BatonT>
Promise<T, BatonT>& Promise<T, BatonT>::operator=(Promise&& other) {
  std::swap(value_, other.value_);
  std::swap(baton_, other.baton_);
  return *this;
}

template <class T, class BatonT>
void Promise<T, BatonT>::throwIfFulfilled() const {
  if (!value_) {
    throw std::logic_error("promise already fulfilled");
  }
}

template <class T, class BatonT>
Promise<T, BatonT>::~Promise() {
  if (value_) {
    setException(folly::make_exception_wrapper<std::logic_error>(
        "promise not fulfilled"));
  }
}

template <class T, class BatonT>
void Promise<T, BatonT>::setException(folly::exception_wrapper e) {
  setTry(folly::Try<T>(e));
}

template <class T, class BatonT>
void Promise<T, BatonT>::setTry(folly::Try<T>&& t) {
  throwIfFulfilled();

  *value_ = std::move(t);
  value_ = nullptr;

  // Baton::post has to be the last step here, since if Promise is not owned by
  // the posting thread, it may be destroyed right after Baton::post is called.
  baton_->post();
}

template <class T, class BatonT>
template <class M>
void Promise<T, BatonT>::setValue(M&& v) {
  static_assert(!std::is_same<T, void>::value, "Use setValue() instead");

  setTry(folly::Try<T>(std::forward<M>(v)));
}

template <class T, class BatonT>
void Promise<T, BatonT>::setValue() {
  static_assert(std::is_same<T, void>::value, "Use setValue(value) instead");

  setTry(folly::Try<void>());
}

template <class T, class BatonT>
template <class F>
void Promise<T, BatonT>::setWith(F&& func) {
  setTry(makeTryWith(std::forward<F>(func)));
}

template <class T, class BatonT>
template <class F>
typename Promise<T, BatonT>::value_type Promise<T, BatonT>::await(F&& func) {
  folly::Try<value_type> result;
  std::exception_ptr funcException;

  BatonT baton;
  baton.wait([&func, &result, &baton, &funcException]() mutable {
    try {
      func(Promise<value_type, BatonT>(result, baton));
    } catch (...) {
      // Save the exception, but still wait for baton to be posted by user code
      // or promise destructor.
      funcException = std::current_exception();
    }
  });

  if (UNLIKELY(funcException != nullptr)) {
    std::rethrow_exception(funcException);
  }

  return std::move(result).value();
}
} // namespace fibers
} // namespace folly
