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

#include <folly/Portability.h>

#if FOLLY_HAS_COROUTINES

#include <folly/experimental/coro/Traits.h>
#include <experimental/coroutine>
#include <type_traits>

using namespace folly::coro;

template <typename T>
struct SomeAwaiter1 {
  bool await_ready();
  void await_suspend(std::experimental::coroutine_handle<>);
  T await_resume();
};

template <typename T>
struct SomeAwaiter2 {
  bool await_ready();
  bool await_suspend(std::experimental::coroutine_handle<>);
  T await_resume();
};

template <typename T>
struct SomeAwaiter3 {
  bool await_ready();
  std::experimental::coroutine_handle<> await_suspend(
      std::experimental::coroutine_handle<>);
  T await_resume();
};

struct MissingAwaitReady {
  void await_suspend(std::experimental::coroutine_handle<>);
  int await_resume();
};

struct WrongAwaitReadyReturnType {
  void* await_ready();
  void await_suspend(std::experimental::coroutine_handle<>);
  int await_resume();
};

struct MissingAwaitSuspend {
  bool await_ready();
  int await_resume();
};

struct WrongAwaitSuspendArgType {
  bool await_ready();
  void await_suspend(float);
  int await_resume();
};

struct MissingAwaitResume {
  bool await_ready();
  void await_suspend(std::experimental::coroutine_handle<void>);
};

struct MemberOperatorCoAwait {
  SomeAwaiter1<void> operator co_await() &;
  SomeAwaiter2<int> operator co_await() &&;
  SomeAwaiter3<float> operator co_await() const&;
};

struct FreeOperatorCoAwait {};
SomeAwaiter1<void> operator co_await(FreeOperatorCoAwait);

struct MoveOnlyFreeOperatorCoAwait {};
SomeAwaiter1<int> operator co_await(MoveOnlyFreeOperatorCoAwait&&);

struct MemberOperatorCoAwaitWithInvalidAwaiter {
  int operator co_await();
};

static_assert(is_awaiter_v<SomeAwaiter1<void>>, "");
static_assert(is_awaiter_v<SomeAwaiter2<int>>, "");
static_assert(is_awaiter_v<SomeAwaiter3<float>>, "");
static_assert(!is_awaiter_v<void>, "");
static_assert(!is_awaiter_v<int>, "");
static_assert(!is_awaiter_v<MissingAwaitReady>, "");
static_assert(!is_awaiter_v<WrongAwaitReadyReturnType>, "");
static_assert(!is_awaiter_v<MissingAwaitSuspend>, "");
static_assert(!is_awaiter_v<WrongAwaitSuspendArgType>, "");
static_assert(!is_awaiter_v<MissingAwaitResume>, "");
static_assert(!is_awaiter_v<MemberOperatorCoAwait>, "");

static_assert(is_awaitable_v<SomeAwaiter1<void>>, "");
static_assert(is_awaitable_v<SomeAwaiter2<int>>, "");
static_assert(is_awaitable_v<SomeAwaiter3<void*>>, "");
static_assert(is_awaitable_v<MemberOperatorCoAwait>, "");
static_assert(is_awaitable_v<MemberOperatorCoAwait&>, "");
static_assert(is_awaitable_v<MemberOperatorCoAwait&&>, "");
static_assert(is_awaitable_v<const MemberOperatorCoAwait&>, "");
static_assert(is_awaitable_v<FreeOperatorCoAwait>, "");
static_assert(is_awaitable_v<FreeOperatorCoAwait&&>, "");
static_assert(is_awaitable_v<const FreeOperatorCoAwait&>, "");
static_assert(is_awaitable_v<MoveOnlyFreeOperatorCoAwait&&>, "");
static_assert(!is_awaitable_v<MoveOnlyFreeOperatorCoAwait&>, "");
static_assert(!is_awaitable_v<const MoveOnlyFreeOperatorCoAwait&>, "");
static_assert(!is_awaitable_v<void>, "");
static_assert(!is_awaitable_v<MemberOperatorCoAwaitWithInvalidAwaiter>, "");

static_assert(
    std::is_same<awaiter_type_t<SomeAwaiter1<void>>, SomeAwaiter1<void>&>::
        value,
    "");
static_assert(
    std::is_same<awaiter_type_t<MemberOperatorCoAwait>, SomeAwaiter2<int>>::
        value,
    "");
static_assert(
    std::is_same<awaiter_type_t<MemberOperatorCoAwait&>, SomeAwaiter1<void>>::
        value,
    "");
static_assert(
    std::is_same<awaiter_type_t<FreeOperatorCoAwait>, SomeAwaiter1<void>>::
        value,
    "");

static_assert(
    std::is_same<await_result_t<SomeAwaiter1<void>>, void>::value,
    "");
static_assert(
    std::is_same<await_result_t<MemberOperatorCoAwait>, int>::value,
    "");
static_assert(
    std::is_same<await_result_t<MemberOperatorCoAwait&>, void>::value,
    "");
static_assert(
    std::is_same<await_result_t<const MemberOperatorCoAwait&>, float>::value,
    "");
static_assert(
    std::is_same<await_result_t<MoveOnlyFreeOperatorCoAwait>, int>::value,
    "");

#endif
