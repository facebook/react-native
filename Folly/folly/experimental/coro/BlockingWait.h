/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/Try.h>
#include <folly/experimental/coro/Traits.h>
#include <folly/fibers/Baton.h>
#include <folly/synchronization/Baton.h>

#include <cassert>
#include <exception>
#include <experimental/coroutine>
#include <type_traits>
#include <utility>

namespace folly {
namespace coro {

namespace detail {

template <typename T>
class BlockingWaitTask;

class BlockingWaitPromiseBase {
  struct FinalAwaiter {
    bool await_ready() noexcept {
      return false;
    }
    template <typename Promise>
    void await_suspend(
        std::experimental::coroutine_handle<Promise> coro) noexcept {
      BlockingWaitPromiseBase& promise = coro.promise();
      promise.baton_.post();
    }
    void await_resume() noexcept {}
  };

 public:
  BlockingWaitPromiseBase() noexcept = default;

  std::experimental::suspend_always initial_suspend() {
    return {};
  }

  FinalAwaiter final_suspend() noexcept {
    return {};
  }

 protected:
  void wait() noexcept {
    baton_.wait();
  }

 private:
  folly::fibers::Baton baton_;
};

template <typename T>
class BlockingWaitPromise final : public BlockingWaitPromiseBase {
 public:
  BlockingWaitPromise() noexcept = default;

  ~BlockingWaitPromise() = default;

  BlockingWaitTask<T> get_return_object() noexcept;

  void unhandled_exception() noexcept {
    result_->emplaceException(
        folly::exception_wrapper::from_exception_ptr(std::current_exception()));
  }

  template <
      typename U,
      std::enable_if_t<std::is_convertible<U, T>::value, int> = 0>
  void return_value(U&& value) noexcept(
      std::is_nothrow_constructible<T, U&&>::value) {
    result_->emplace(static_cast<U&&>(value));
  }

  folly::Try<T> getAsTry() {
    folly::Try<T> result;
    result_ = &result;
    std::experimental::coroutine_handle<BlockingWaitPromise<T>>::from_promise(
        *this)
        .resume();
    this->wait();
    return result;
  }

  T get() {
    return getAsTry().value();
  }

 private:
  folly::Try<T>* result_;
};

template <typename T>
class BlockingWaitPromise<T&> final : public BlockingWaitPromiseBase {
 public:
  BlockingWaitPromise() noexcept = default;

  ~BlockingWaitPromise() = default;

  BlockingWaitTask<T&> get_return_object() noexcept;

  void unhandled_exception() noexcept {
    result_->emplaceException(
        folly::exception_wrapper::from_exception_ptr(std::current_exception()));
  }

  auto yield_value(T&& value) noexcept {
    result_->emplace(std::ref(value));
    return final_suspend();
  }

  auto yield_value(T& value) noexcept {
    result_->emplace(std::ref(value));
    return final_suspend();
  }

#if 0
  void return_value(T& value) noexcept {
    result_->emplace(std::ref(value));
  }
#endif

  void return_void() {
    // This should never be reachable.
    // The coroutine should either have suspended at co_yield or should have
    // thrown an exception and skipped over the implicit co_return and
    // gone straight to unhandled_exception().
    std::abort();
  }

  folly::Try<std::reference_wrapper<T>> getAsTry() {
    folly::Try<std::reference_wrapper<T>> result;
    result_ = &result;
    std::experimental::coroutine_handle<BlockingWaitPromise<T&>>::from_promise(
        *this)
        .resume();
    this->wait();
    return result;
  }

  T& get() {
    return getAsTry().value();
  }

 private:
  folly::Try<std::reference_wrapper<T>>* result_;
};

template <>
class BlockingWaitPromise<void> final : public BlockingWaitPromiseBase {
 public:
  BlockingWaitPromise() = default;

  BlockingWaitTask<void> get_return_object() noexcept;

  void return_void() noexcept {}

  void unhandled_exception() noexcept {
    result_->emplaceException(
        exception_wrapper::from_exception_ptr(std::current_exception()));
  }

  folly::Try<void> getAsTry() {
    folly::Try<void> result;
    result_ = &result;
    std::experimental::coroutine_handle<
        BlockingWaitPromise<void>>::from_promise(*this)
        .resume();
    this->wait();
    return result;
  }

  void get() {
    return getAsTry().value();
  }

 private:
  folly::Try<void>* result_;
};

template <typename T>
class BlockingWaitTask {
 public:
  using promise_type = BlockingWaitPromise<T>;
  using handle_t = std::experimental::coroutine_handle<promise_type>;

  explicit BlockingWaitTask(handle_t coro) noexcept : coro_(coro) {}

  BlockingWaitTask(BlockingWaitTask&& other) noexcept
      : coro_(std::exchange(other.coro_, {})) {}

  BlockingWaitTask& operator=(BlockingWaitTask&& other) noexcept = delete;

  ~BlockingWaitTask() {
    if (coro_) {
      coro_.destroy();
    }
  }

  decltype(auto) getAsTry() && {
    return coro_.promise().getAsTry();
  }

  decltype(auto) get() && {
    return coro_.promise().get();
  }

 private:
  handle_t coro_;
};

template <typename T>
inline BlockingWaitTask<T>
BlockingWaitPromise<T>::get_return_object() noexcept {
  return BlockingWaitTask<T>{
      std::experimental::coroutine_handle<BlockingWaitPromise<T>>::from_promise(
          *this)};
}

template <typename T>
inline BlockingWaitTask<T&>
BlockingWaitPromise<T&>::get_return_object() noexcept {
  return BlockingWaitTask<T&>{std::experimental::coroutine_handle<
      BlockingWaitPromise<T&>>::from_promise(*this)};
}

inline BlockingWaitTask<void>
BlockingWaitPromise<void>::get_return_object() noexcept {
  return BlockingWaitTask<void>{std::experimental::coroutine_handle<
      BlockingWaitPromise<void>>::from_promise(*this)};
}

template <typename T>
struct decay_rvalue_reference {
  using type = T;
};

template <typename T>
struct decay_rvalue_reference<T&&> : std::decay<T> {};

template <typename T>
using decay_rvalue_reference_t = typename decay_rvalue_reference<T>::type;

template <
    typename Awaitable,
    typename Result = await_result_t<Awaitable>,
    std::enable_if_t<!std::is_lvalue_reference<Result>::value, int> = 0>
auto makeBlockingWaitTask(Awaitable&& awaitable)
    -> BlockingWaitTask<decay_rvalue_reference_t<Result>> {
  co_return co_await static_cast<Awaitable&&>(awaitable);
}

template <
    typename Awaitable,
    typename Result = await_result_t<Awaitable>,
    std::enable_if_t<std::is_lvalue_reference<Result>::value, int> = 0>
auto makeBlockingWaitTask(Awaitable&& awaitable)
    -> BlockingWaitTask<decay_rvalue_reference_t<Result>> {
  co_yield co_await static_cast<Awaitable&&>(awaitable);
}

template <
    typename Awaitable,
    typename Result = await_result_t<Awaitable>,
    std::enable_if_t<std::is_void<Result>::value, int> = 0>
BlockingWaitTask<void> makeRefBlockingWaitTask(Awaitable&& awaitable) {
  co_await static_cast<Awaitable&&>(awaitable);
}

template <
    typename Awaitable,
    typename Result = await_result_t<Awaitable>,
    std::enable_if_t<!std::is_void<Result>::value, int> = 0>
auto makeRefBlockingWaitTask(Awaitable&& awaitable)
    -> BlockingWaitTask<std::add_lvalue_reference_t<Result>> {
  co_yield co_await static_cast<Awaitable&&>(awaitable);
}

} // namespace detail

/// blockingWait(Awaitable&&) -> await_result_t<Awaitable>
///
/// This function co_awaits the passed awaitable object and blocks the current
/// thread until the operation completes.
///
/// This is useful for launching an asynchronous operation from the top-level
/// main() function or from unit-tests.
///
/// WARNING:
/// Avoid using this function within any code that might run on the thread
/// of an executor as this can potentially lead to deadlock if the operation
/// you are waiting on needs to do some work on that executor in order to
/// complete.
template <typename Awaitable>
auto blockingWait(Awaitable&& awaitable)
    -> detail::decay_rvalue_reference_t<await_result_t<Awaitable>> {
  return static_cast<std::add_rvalue_reference_t<await_result_t<Awaitable>>>(
      detail::makeRefBlockingWaitTask(static_cast<Awaitable&&>(awaitable))
          .get());
}

} // namespace coro
} // namespace folly
