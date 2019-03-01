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

namespace folly {
namespace detail {

template <typename... Ts>
struct TryTuple {
  template <typename... Ts2>
  static std::tuple<Ts...> unwrap(
      std::tuple<folly::Try<Ts>...>&& o,
      Ts2&&... ts2) {
    static_assert(
        sizeof...(ts2) < std::tuple_size<std::tuple<folly::Try<Ts>...>>::value,
        "Non-templated unwrap should be used instead");

    return unwrap(
        std::move(o),
        std::forward<Ts2>(ts2)...,
        std::move(*std::get<sizeof...(ts2)>(o)));
  }

  static std::tuple<Ts...> unwrap(
      std::tuple<folly::Try<Ts>...>&& /* o */,
      Ts&&... ts) {
    return std::tuple<Ts...>(std::forward<Ts>(ts)...);
  }
};

} // namespace detail
} // namespace folly
