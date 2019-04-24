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

#include <folly/Traits.h>

#include <experimental/coroutine>
#include <type_traits>

namespace folly {
namespace coro {

namespace detail {

template <typename T>
struct _is_coroutine_handle : std::false_type {};

template <typename T>
struct _is_coroutine_handle<std::experimental::coroutine_handle<T>>
    : std::true_type {};

template <typename T>
struct _is_valid_await_suspend_return_type : folly::Disjunction<
                                                 std::is_void<T>,
                                                 std::is_same<bool, T>,
                                                 _is_coroutine_handle<T>> {};
} // namespace detail

/// is_awaiter<T>::value
/// is_awaiter_v<T>
///
/// Template metafunction for querying whether the specified type implements
/// the 'Awaiter' concept.
///
/// An 'Awaiter' must have the following three methods.
/// - awaiter.await_ready() -> bool
/// - awaiter.await_suspend(std::experimental::coroutine_handle<void>()) ->
///     void OR
///     bool OR
///     std::experimental::coroutine_handle<T> for some T
/// - awaiter.await_resume()
///
/// Note that the requirement to accept coroutine_handle<void> rather than
/// just some coroutine_handle<P> is to ensure that the awaitable can be
/// awaited in any coroutine context where the promise_type does not modify
/// what is normally awaitable through use of await_transform().
template <typename T, typename = void>
struct is_awaiter : std::false_type {};

template <typename T>
struct is_awaiter<
    T,
    folly::void_t<
        decltype(std::declval<T&>().await_ready()),
        decltype(std::declval<T&>().await_suspend(
            std::declval<std::experimental::coroutine_handle<void>>())),
        decltype(std::declval<T&>().await_resume())>>
    : folly::Conjunction<
          std::is_same<bool, decltype(std::declval<T&>().await_ready())>,
          detail::_is_valid_await_suspend_return_type<decltype(
              std::declval<T&>().await_suspend(
                  std::declval<
                      std::experimental::coroutine_handle<void>>()))>> {};

template <typename T>
constexpr bool is_awaiter_v = is_awaiter<T>::value;

namespace detail {

template <typename Awaitable, typename = void>
struct _has_member_operator_co_await : std::false_type {};

template <typename Awaitable>
struct _has_member_operator_co_await<
    Awaitable,
    folly::void_t<decltype(std::declval<Awaitable>().operator co_await())>>
    : is_awaiter<decltype(std::declval<Awaitable>().operator co_await())> {};

template <typename Awaitable, typename = void>
struct _has_free_operator_co_await : std::false_type {};

template <typename Awaitable>
struct _has_free_operator_co_await<
    Awaitable,
    folly::void_t<decltype(operator co_await(std::declval<Awaitable>()))>>
    : is_awaiter<decltype(operator co_await(std::declval<Awaitable>()))> {};

} // namespace detail

/// is_awaitable<T>::value
/// is_awaitable_v<T>
///
/// Query if a type, T, is awaitable within the context of any coroutine whose
/// promise_type does not have an await_transform() that modifies what is
/// normally awaitable.
///
/// A type, T, is awaitable if it is an Awaiter, or if it has either a
/// member operator co_await() or a free-function operator co_await() that
/// returns an Awaiter.
template <typename T>
struct is_awaitable : folly::Disjunction<
                          detail::_has_member_operator_co_await<T>,
                          detail::_has_free_operator_co_await<T>,
                          is_awaiter<T>> {};

template <typename T>
constexpr bool is_awaitable_v = is_awaitable<T>::value;

/// get_awaiter(Awaitable&&) -> awaiter_type_t<Awaitable>
///
/// The get_awaiter() function takes an Awaitable type and returns a value
/// that contains the await_ready(), await_suspend() and await_resume() methods
/// for that type.
///
/// This encapsulates calling 'operator co_await()' if it exists.
template <
    typename Awaitable,
    std::enable_if_t<
        folly::Conjunction<
            is_awaiter<Awaitable>,
            folly::Negation<detail::_has_free_operator_co_await<Awaitable>>,
            folly::Negation<detail::_has_member_operator_co_await<Awaitable>>>::
            value,
        int> = 0>
Awaitable& get_awaiter(Awaitable&& awaitable) {
  return awaitable;
}

template <
    typename Awaitable,
    std::enable_if_t<
        detail::_has_member_operator_co_await<Awaitable>::value,
        int> = 0>
decltype(auto) get_awaiter(Awaitable&& awaitable) {
  return static_cast<Awaitable&&>(awaitable).operator co_await();
}

template <
    typename Awaitable,
    std::enable_if_t<
        folly::Conjunction<
            detail::_has_free_operator_co_await<Awaitable>,
            folly::Negation<detail::_has_member_operator_co_await<Awaitable>>>::
            value,
        int> = 0>
decltype(auto) get_awaiter(Awaitable&& awaitable) {
  return operator co_await(static_cast<Awaitable&&>(awaitable));
}

/// awaiter_type<Awaitable>
///
/// A template-metafunction that lets you query the type that will be used
/// as the Awaiter object when you co_await a value of type Awaitable.
/// This is the return-type of get_awaiter() when passed a value of type
/// Awaitable.
template <typename Awaitable, typename = void>
struct awaiter_type {};

template <typename Awaitable>
struct awaiter_type<Awaitable, std::enable_if_t<is_awaitable_v<Awaitable>>> {
  using type = decltype(get_awaiter(std::declval<Awaitable>()));
};

/// await_result<Awaitable>
///
/// A template metafunction that allows you to query the type that will result
/// from co_awaiting a value of that type in the context of a coroutine that
/// does not modify the normal behaviour with promise_type::await_transform().
template <typename Awaitable>
using awaiter_type_t = typename awaiter_type<Awaitable>::type;

template <typename Awaitable, typename = void>
struct await_result {};

template <typename Awaitable>
struct await_result<Awaitable, std::enable_if_t<is_awaitable_v<Awaitable>>> {
  using type = decltype(get_awaiter(std::declval<Awaitable>()).await_resume());
};

template <typename Awaitable>
using await_result_t = typename await_result<Awaitable>::type;

} // namespace coro
} // namespace folly
