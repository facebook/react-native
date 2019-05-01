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
#include <utility>

/**
 * folly implementation of `std::overload` like functionality
 *
 * Example:
 *  struct One {};
 *  struct Two {};
 *  boost::variant<One, Two> value;
 *
 *  variant_match(value,
 *    [] (const One& one) { ... },
 *    [] (const Two& two) { ... });
 */

namespace folly {

namespace detail {
template <typename...>
struct Overload;

template <typename Case, typename... Cases>
struct Overload<Case, Cases...> : Overload<Cases...>, Case {
  Overload(Case c, Cases... cs)
      : Overload<Cases...>(std::move(cs)...), Case(std::move(c)) {}

  using Case::operator();
  using Overload<Cases...>::operator();
};

template <typename Case>
struct Overload<Case> : Case {
  explicit Overload(Case c) : Case(std::move(c)) {}

  using Case::operator();
};
} // namespace detail

/*
 * Combine multiple `Cases` in one function object
 */
template <typename... Cases>
decltype(auto) overload(Cases&&... cases) {
  return detail::Overload<typename std::decay<Cases>::type...>{
      std::forward<Cases>(cases)...};
}

/*
 * Match `Variant` with one of the `Cases`
 *
 * Note: you can also use `[] (const auto&) {...}` as default case
 *
 */
template <typename Variant, typename... Cases>
decltype(auto) variant_match(Variant&& variant, Cases&&... cases) {
  return apply_visitor(
      overload(std::forward<Cases>(cases)...), std::forward<Variant>(variant));
}

} // namespace folly
