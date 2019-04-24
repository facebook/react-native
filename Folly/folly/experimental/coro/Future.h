/*
 * Copyright 2017-present Facebook, Inc.
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

#include <glog/logging.h>

#include <folly/Executor.h>
#include <folly/experimental/coro/Promise.h>
#include <folly/experimental/coro/Task.h>
#include <folly/experimental/coro/Wait.h>
#include <folly/futures/Future.h>

namespace folly {
namespace coro {

/*
 * Future object attached to a running coroutine. Implement await_* APIs.
 */
template <typename T>
class Future {
 public:
  Future(const Future&) = delete;
  Future(Future&& other) : promise_(other.promise_) {
    other.promise_ = nullptr;
  }

  class Awaiter {
   public:
    explicit Awaiter(Promise<T>* promise) noexcept : promise_(promise) {}

    bool await_ready() noexcept {
      return promise_->isReady();
    }

    bool await_suspend(std::experimental::coroutine_handle<> awaiter) noexcept {
      auto state = promise_->state_.load(std::memory_order_acquire);

      if (state == Promise<T>::State::HAS_RESULT) {
        return false;
      }
      DCHECK(state == Promise<T>::State::EMPTY);

      promise_->awaiter_ = std::move(awaiter);

      if (promise_->state_.compare_exchange_strong(
              state,
              Promise<T>::State::HAS_AWAITER,
              std::memory_order_release,
              std::memory_order_acquire)) {
        return true;
      }

      DCHECK(promise_->state_ == Promise<T>::State::HAS_RESULT);
      return false;
    }

    T await_resume() {
      DCHECK(promise_->state_ == Promise<T>::State::HAS_RESULT);
      return std::move(promise_->result_).value();
    }

   private:
    Promise<T>* promise_;
  };

  Awaiter operator co_await() && noexcept {
    return Awaiter{promise_};
  }

  auto toFuture() &&;

  bool isReady() const noexcept {
    DCHECK(promise_);
    return promise_->isReady();
  }

  ~Future() {
    if (!promise_) {
      return;
    }

    auto state = promise_->state_.load(std::memory_order_acquire);

    do {
      DCHECK(state != Promise<T>::State::DETACHED);
      DCHECK(state != Promise<T>::State::HAS_AWAITER);

      if (state == Promise<T>::State::HAS_RESULT) {
        auto ch = std::experimental::coroutine_handle<Promise<T>>::from_promise(
            *promise_);
        DCHECK(ch.done());
        ch.destroy();
        return;
      }
      DCHECK(state == Promise<T>::State::EMPTY);
    } while (!promise_->state_.compare_exchange_weak(
        state,
        Promise<T>::State::DETACHED,
        std::memory_order::memory_order_release,
        std::memory_order::memory_order_acquire));
  }

 private:
  friend class Task<T>;
  template <typename U>
  friend class Promise;

  Future(Promise<T>& promise) : promise_(&promise) {}

  Promise<T>* promise_;
};

namespace detail {
inline SemiFuture<Unit> toSemiFuture(Future<void> future) {
  co_await std::move(future);
  co_return folly::unit;
}

template <typename T>
SemiFuture<T> toSemiFuture(Future<T> future) {
  return SemiFuture<T>::fromAwaitable(std::move(future));
}
} // namespace detail

template <typename T>
auto Future<T>::toFuture() && {
  auto executor = promise_->executor_;
  return detail::toSemiFuture(std::move(*this)).via(executor);
}
} // namespace coro
} // namespace folly
