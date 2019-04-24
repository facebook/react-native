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

#include <experimental/coroutine>
#include <memory>

#include <folly/Executor.h>
#include <folly/experimental/coro/Traits.h>

#include <glog/logging.h>

namespace folly {

class InlineExecutor;

namespace coro {

namespace detail {

class ViaCoroutine {
 public:
  class promise_type {
   public:
    promise_type(folly::Executor* executor) noexcept : executor_(executor) {}

    ViaCoroutine get_return_object() noexcept {
      return ViaCoroutine{
          std::experimental::coroutine_handle<promise_type>::from_promise(
              *this)};
    }

    std::experimental::suspend_always initial_suspend() {
      return {};
    }

    auto final_suspend() {
      struct Awaiter {
        bool await_ready() noexcept {
          return false;
        }
        void await_suspend(
            std::experimental::coroutine_handle<promise_type> coro) noexcept {
          // Schedule resumption of the coroutine on the executor.
          auto& promise = coro.promise();
          promise.executor_->add(promise.continuation_);
        }
        void await_resume() noexcept {}
      };

      return Awaiter{};
    }

    [[noreturn]] void unhandled_exception() noexcept {
      LOG(FATAL) << "ViaCoroutine threw an unhandled exception";
    }

    void return_void() noexcept {}

    void setContinuation(
        std::experimental::coroutine_handle<> continuation) noexcept {
      DCHECK(!continuation_);
      continuation_ = continuation;
    }

   private:
    folly::Executor* executor_;
    std::experimental::coroutine_handle<> continuation_;
  };

  ViaCoroutine(ViaCoroutine&& other) noexcept
      : coro_(std::exchange(other.coro_, {})) {}

  ~ViaCoroutine() {
    destroy();
  }

  ViaCoroutine& operator=(ViaCoroutine other) noexcept {
    swap(other);
    return *this;
  }

  void swap(ViaCoroutine& other) noexcept {
    std::swap(coro_, other.coro_);
  }

  std::experimental::coroutine_handle<> getWrappedCoroutine(
      std::experimental::coroutine_handle<> continuation) noexcept {
    if (coro_) {
      coro_.promise().setContinuation(continuation);
      return coro_;
    } else {
      return continuation;
    }
  }

  void destroy() {
    if (coro_) {
      std::exchange(coro_, {}).destroy();
    }
  }

  static ViaCoroutine create(folly::Executor* executor) {
    co_return;
  }

  static ViaCoroutine createInline() noexcept {
    return ViaCoroutine{std::experimental::coroutine_handle<promise_type>{}};
  }

 private:
  friend class promise_type;

  explicit ViaCoroutine(
      std::experimental::coroutine_handle<promise_type> coro) noexcept
      : coro_(coro) {}

  std::experimental::coroutine_handle<promise_type> coro_;
};

} // namespace detail

template <typename Awaiter>
class ViaIfAsyncAwaiter {
 public:
  static_assert(
      folly::coro::is_awaiter_v<Awaiter>,
      "Awaiter type does not implement the Awaiter interface.");

  template <typename Awaitable>
  explicit ViaIfAsyncAwaiter(folly::InlineExecutor*, Awaitable&& awaitable)
      : viaCoroutine_(detail::ViaCoroutine::createInline()),
        awaiter_(
            folly::coro::get_awaiter(static_cast<Awaitable&&>(awaitable))) {}

  template <typename Awaitable>
  explicit ViaIfAsyncAwaiter(folly::Executor* executor, Awaitable&& awaitable)
      : viaCoroutine_(detail::ViaCoroutine::create(executor)),
        awaiter_(
            folly::coro::get_awaiter(static_cast<Awaitable&&>(awaitable))) {}

  bool await_ready() noexcept(
      noexcept(std::declval<Awaiter&>().await_ready())) {
    return awaiter_.await_ready();
  }

  auto
  await_suspend(std::experimental::coroutine_handle<> continuation) noexcept(
      noexcept(std::declval<Awaiter&>().await_suspend(continuation))) {
    return awaiter_.await_suspend(
        viaCoroutine_.getWrappedCoroutine(continuation));
  }

  decltype(auto) await_resume() noexcept(
      noexcept(std::declval<Awaiter&>().await_resume())) {
    viaCoroutine_.destroy();
    return awaiter_.await_resume();
  }

  detail::ViaCoroutine viaCoroutine_;
  Awaiter awaiter_;
};

template <typename Awaitable>
class ViaIfAsyncAwaitable {
 public:
  explicit ViaIfAsyncAwaitable(
      folly::Executor* executor,
      Awaitable&&
          awaitable) noexcept(std::is_nothrow_move_constructible<Awaitable>::
                                  value)
      : executor_(executor), awaitable_(static_cast<Awaitable&&>(awaitable)) {}

  template <typename Awaitable2>
  friend auto operator co_await(ViaIfAsyncAwaitable<Awaitable2>&& awaitable)
      -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<Awaitable2>>;

  template <typename Awaitable2>
  friend auto operator co_await(ViaIfAsyncAwaitable<Awaitable2>& awaitable)
      -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<Awaitable2&>>;

  template <typename Awaitable2>
  friend auto operator co_await(
      const ViaIfAsyncAwaitable<Awaitable2>&& awaitable)
      -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<const Awaitable2&&>>;

  template <typename Awaitable2>
  friend auto operator co_await(
      const ViaIfAsyncAwaitable<Awaitable2>& awaitable)
      -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<const Awaitable2&>>;

 private:
  folly::Executor* executor_;
  Awaitable awaitable_;
};

template <typename Awaitable>
auto operator co_await(ViaIfAsyncAwaitable<Awaitable>&& awaitable)
    -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<Awaitable>> {
  return ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<Awaitable>>{
      awaitable.executor_, static_cast<Awaitable&&>(awaitable.awaitable_)};
}

template <typename Awaitable>
auto operator co_await(ViaIfAsyncAwaitable<Awaitable>& awaitable)
    -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<Awaitable&>> {
  return ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<Awaitable&>>{
      awaitable.executor_, awaitable.awaitable_};
}

template <typename Awaitable>
auto operator co_await(const ViaIfAsyncAwaitable<Awaitable>&& awaitable)
    -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<const Awaitable&&>> {
  return ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<const Awaitable&&>>{
      awaitable.executor_,
      static_cast<const Awaitable&&>(awaitable.awaitable_)};
}

template <typename Awaitable>
auto operator co_await(const ViaIfAsyncAwaitable<Awaitable>& awaitable)
    -> ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<const Awaitable&>> {
  return ViaIfAsyncAwaiter<folly::coro::awaiter_type_t<const Awaitable&>>{
      awaitable.executor_, awaitable.awaitable_};
}

/// Returns a new awaitable that will resume execution of the awaiting coroutine
/// on a specified executor in the case that the operation does not complete
/// synchronously.
///
/// If the operation completes synchronously then the awaiting coroutine
/// will continue execution on the current thread without transitioning
/// execution to the specified executor.
template <typename Awaitable>
auto co_viaIfAsync(folly::Executor* executor, Awaitable&& awaitable)
    -> ViaIfAsyncAwaitable<Awaitable> {
  static_assert(
      folly::coro::is_awaitable_v<Awaitable>,
      "co_viaIfAsync() argument 2 is not awaitable.");
  return ViaIfAsyncAwaitable<Awaitable>{executor,
                                        static_cast<Awaitable&&>(awaitable)};
}

} // namespace coro
} // namespace folly
