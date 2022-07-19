/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

namespace facebook::react::bridging {

template <
    typename T,
    typename C,
    typename R,
    typename... Args,
    typename... JSArgs>
T callFromJs(
    jsi::Runtime &rt,
    R (C::*method)(jsi::Runtime &, Args...),
    const std::shared_ptr<CallInvoker> &jsInvoker,
    C *instance,
    JSArgs &&...args) {
  static_assert(
      sizeof...(Args) == sizeof...(JSArgs), "Incorrect arguments length");

  if constexpr (std::is_void_v<T>) {
    (instance->*method)(
        rt, fromJs<Args>(rt, std::forward<JSArgs>(args), jsInvoker)...);

  } else if constexpr (std::is_void_v<R>) {
    static_assert(
        std::is_same_v<T, jsi::Value>,
        "Void functions may only return undefined");

    (instance->*method)(
        rt, fromJs<Args>(rt, std::forward<JSArgs>(args), jsInvoker)...);
    return jsi::Value();

  } else if constexpr (is_jsi_v<T>) {
    return toJs(
        rt,
        (instance->*method)(
            rt, fromJs<Args>(rt, std::forward<JSArgs>(args), jsInvoker)...),
        jsInvoker);

  } else {
    return (instance->*method)(
        rt, fromJs<Args>(rt, std::forward<JSArgs>(args), jsInvoker)...);
  }
}

template <typename R, typename... Args>
constexpr size_t getParameterCount(R (*)(Args...)) {
  return sizeof...(Args);
}

template <typename C, typename R, typename... Args>
constexpr size_t getParameterCount(R (C::*)(Args...)) {
  return sizeof...(Args);
}

} // namespace facebook::react::bridging
