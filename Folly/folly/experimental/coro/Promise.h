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

#include <type_traits>

#include <glog/logging.h>

#include <folly/ExceptionWrapper.h>
#include <folly/Try.h>
#include <folly/experimental/coro/Task.h>
#include <folly/experimental/coro/Utils.h>
#include <folly/experimental/coro/ViaIfAsync.h>
#include <folly/futures/Future.h>

namespace folly {
namespace coro {

enum class PromiseState {
  // Coroutine hasn't started
  EMPTY,
  // Coroutine is running, but Future object managing this coroutine was
  // destroyed
  DETACHED,
  // Some other coroutine is waiting on this coroutine to be complete
  HAS_AWAITER,
  // Coroutine is finished, result is stored inside Promise
  HAS_RESULT
};

template <typename T>
class Future;

template <typename T>
class PromiseBase {
 public:
  template <typename U>
  void return_value(U&& value) {
    static_assert(
        std::is_convertible<U&&, T>::value,
        "Returned value is not convertible to task result type");
    result_.emplace(static_cast<U&&>(value));
  }

 protected:
  folly::Try<T> result_;
};

template <>
class PromiseBase<void> {
 public:
  void return_void() {}

 protected:
  folly::Try<void> result_;
};

template <typename T>
class Promise : public PromiseBase<T> {
 public:
  using State = PromiseState;

  Promise() {}

  ~Promise() {}

  Task<T> get_return_object() {
    return {*this};
  }

  std::experimental::suspend_always initial_suspend() {
    return {};
  }

  template <typename U>
  auto await_transform(Task<U>&& task) {
    return std::move(task).viaInline(executor_);
  }

  template <typename Awaitable>
  decltype(auto) await_transform(Awaitable&& awaitable) {
    using folly::coro::co_viaIfAsync;
    return co_viaIfAsync(executor_, std::forward<Awaitable>(awaitable));
  }

  auto await_transform(getCurrentExecutor) {
    return AwaitableReady<Executor*>(executor_);
  }

  class FinalSuspender;

  FinalSuspender final_suspend() {
    return {*this};
  }

  void unhandled_exception() {
    this->result_ =
        Try<T>(exception_wrapper::from_exception_ptr(std::current_exception()));
  }

  void start() {
    std::experimental::coroutine_handle<Promise>::from_promise (*this)();
  }

  bool isReady() const noexcept {
    return state_.load(std::memory_order_acquire) ==
        Promise<T>::State::HAS_RESULT;
  }

 private:
  friend class Future<T>;
  friend class Task<T>;
  template <typename U>
  friend class Promise;

  std::atomic<State> state_{State::EMPTY};

  std::experimental::coroutine_handle<> awaiter_;

  Executor* executor_{nullptr};
};

template <typename T>
class Promise<T>::FinalSuspender {
 public:
  bool await_ready() {
    return promise_.state_.load(std::memory_order_acquire) == State::DETACHED;
  }

  bool await_suspend(std::experimental::coroutine_handle<>) {
    auto state = promise_.state_.load(std::memory_order_acquire);

    do {
      if (state == State::DETACHED) {
        return false;
      }
      DCHECK(state != State::HAS_RESULT);
    } while (!promise_.state_.compare_exchange_weak(
        state,
        State::HAS_RESULT,
        std::memory_order_release,
        std::memory_order_acquire));

    if (state == State::HAS_AWAITER) {
      promise_.awaiter_.resume();
    }

    return true;
  }

  void await_resume() {}

 private:
  friend class Promise;

  FinalSuspender(Promise& promise) : promise_(promise) {}
  Promise& promise_;
};

} // namespace coro
} // namespace folly
