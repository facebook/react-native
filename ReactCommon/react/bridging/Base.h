/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Convert.h>

#include <ReactCommon/CallInvoker.h>
#include <folly/Function.h>
#include <jsi/jsi.h>

#include <cstdint>
#include <memory>
#include <type_traits>

namespace facebook::react {

template <typename T, typename = void>
struct Bridging;

template <>
struct Bridging<void> {
  // Highly generic code may result in "casting" to void.
  static void fromJs(jsi::Runtime &, const jsi::Value &) {}
};

namespace bridging {
namespace detail {

template <typename F>
struct function_wrapper;

template <typename C, typename R, typename... Args>
struct function_wrapper<R (C::*)(Args...)> {
  using type = folly::Function<R(Args...)>;
};

template <typename C, typename R, typename... Args>
struct function_wrapper<R (C::*)(Args...) const> {
  using type = folly::Function<R(Args...)>;
};

template <typename T, typename = void>
struct bridging_wrapper {
  using type = remove_cvref_t<T>;
};

// Convert lambda types to move-only function types since we can't specialize
// Bridging templates for arbitrary lambdas.
template <typename T>
struct bridging_wrapper<
    T,
    std::void_t<decltype(&remove_cvref_t<T>::operator())>>
    : function_wrapper<decltype(&remove_cvref_t<T>::operator())> {};

} // namespace detail

template <typename T>
using bridging_t = typename detail::bridging_wrapper<T>::type;

template <typename R, typename T, std::enable_if_t<is_jsi_v<T>, int> = 0>
auto fromJs(jsi::Runtime &rt, T &&value, const std::shared_ptr<CallInvoker> &)
    -> decltype(static_cast<R>(convert(rt, std::forward<T>(value)))) {
  return convert(rt, std::forward<T>(value));
}

template <typename R, typename T>
auto fromJs(jsi::Runtime &rt, T &&value, const std::shared_ptr<CallInvoker> &)
    -> decltype(Bridging<remove_cvref_t<R>>::fromJs(
        rt,
        convert(rt, std::forward<T>(value)))) {
  return Bridging<remove_cvref_t<R>>::fromJs(
      rt, convert(rt, std::forward<T>(value)));
}

template <typename R, typename T>
auto fromJs(
    jsi::Runtime &rt,
    T &&value,
    const std::shared_ptr<CallInvoker> &jsInvoker)
    -> decltype(Bridging<remove_cvref_t<R>>::fromJs(
        rt,
        convert(rt, std::forward<T>(value)),
        jsInvoker)) {
  return Bridging<remove_cvref_t<R>>::fromJs(
      rt, convert(rt, std::forward<T>(value)), jsInvoker);
}

template <typename T, std::enable_if_t<is_jsi_v<T>, int> = 0>
auto toJs(
    jsi::Runtime &rt,
    T &&value,
    const std::shared_ptr<CallInvoker> & = nullptr) -> remove_cvref_t<T> {
  return convert(rt, std::forward<T>(value));
}

template <typename T>
auto toJs(
    jsi::Runtime &rt,
    T &&value,
    const std::shared_ptr<CallInvoker> & = nullptr)
    -> decltype(Bridging<bridging_t<T>>::toJs(rt, std::forward<T>(value))) {
  return Bridging<bridging_t<T>>::toJs(rt, std::forward<T>(value));
}

template <typename T>
auto toJs(
    jsi::Runtime &rt,
    T &&value,
    const std::shared_ptr<CallInvoker> &jsInvoker)
    -> decltype(Bridging<bridging_t<T>>::toJs(
        rt,
        std::forward<T>(value),
        jsInvoker)) {
  return Bridging<bridging_t<T>>::toJs(rt, std::forward<T>(value), jsInvoker);
}

template <typename, typename = jsi::Value, typename = void>
inline constexpr bool supportsFromJs = false;

template <typename T, typename Arg = jsi::Value>
inline constexpr bool supportsFromJs<
    T,
    Arg,
    std::void_t<decltype(fromJs<T>(
        std::declval<jsi::Runtime &>(),
        std::declval<Arg>(),
        nullptr))>> = true;

template <typename, typename = jsi::Value, typename = void>
inline constexpr bool supportsToJs = false;

template <typename T, typename Ret = jsi::Value>
inline constexpr bool supportsToJs<
    T,
    Ret,
    std::void_t<decltype(toJs(
        std::declval<jsi::Runtime &>(),
        std::declval<T>(),
        nullptr))>> =
    std::is_convertible_v<
        decltype(toJs(
            std::declval<jsi::Runtime &>(),
            std::declval<T>(),
            nullptr)),
        Ret>;

} // namespace bridging
} // namespace facebook::react
