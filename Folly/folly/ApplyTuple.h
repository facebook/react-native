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

/*
 * Defines a function folly::applyTuple, which takes a function and a
 * std::tuple of arguments and calls the function with those
 * arguments.
 *
 * Example:
 *
 *    int x = folly::applyTuple(std::plus<int>(), std::make_tuple(12, 12));
 *    ASSERT(x == 24);
 */

#pragma once

#include <functional>
#include <tuple>
#include <utility>

namespace folly {

//////////////////////////////////////////////////////////////////////

namespace detail {
namespace apply_tuple {

template <std::size_t...>
struct IndexSequence {};

template <std::size_t N, std::size_t... Is>
struct MakeIndexSequence : MakeIndexSequence<N - 1, N - 1, Is...> {};

template <std::size_t... Is>
struct MakeIndexSequence<0, Is...> : IndexSequence<Is...> {};

inline constexpr std::size_t sum() {
  return 0;
}
template <typename... Args>
inline constexpr std::size_t sum(std::size_t v1, Args... vs) {
  return v1 + sum(vs...);
}

template <typename... Tuples>
struct TupleSizeSum {
  static constexpr auto value = sum(std::tuple_size<Tuples>::value...);
};

template <typename... Tuples>
using MakeIndexSequenceFromTuple = MakeIndexSequence<
    TupleSizeSum<typename std::decay<Tuples>::type...>::value>;

// This is to allow using this with pointers to member functions,
// where the first argument in the tuple will be the this pointer.
template <class F>
inline constexpr F&& makeCallable(F&& f) {
  return std::forward<F>(f);
}
template <class M, class C>
inline constexpr auto makeCallable(M(C::*d)) -> decltype(std::mem_fn(d)) {
  return std::mem_fn(d);
}

template <class F, class Tuple, std::size_t... Indexes>
inline constexpr auto call(F&& f, Tuple&& t, IndexSequence<Indexes...>)
    -> decltype(
        std::forward<F>(f)(std::get<Indexes>(std::forward<Tuple>(t))...)) {
  return std::forward<F>(f)(std::get<Indexes>(std::forward<Tuple>(t))...);
}

template <class Tuple, std::size_t... Indexes>
inline constexpr auto forwardTuple(Tuple&& t, IndexSequence<Indexes...>)
    -> decltype(
        std::forward_as_tuple(std::get<Indexes>(std::forward<Tuple>(t))...)) {
  return std::forward_as_tuple(std::get<Indexes>(std::forward<Tuple>(t))...);
}

} // namespace apply_tuple
} // namespace detail

//////////////////////////////////////////////////////////////////////

/**
 * Invoke a callable object with a set of arguments passed as a tuple, or a
 *     series of tuples
 *
 * Example: the following lines are equivalent
 *     func(1, 2, 3, "foo");
 *     applyTuple(func, std::make_tuple(1, 2, 3, "foo"));
 *     applyTuple(func, std::make_tuple(1, 2), std::make_tuple(3, "foo"));
 */

template <class F, class... Tuples>
inline constexpr auto applyTuple(F&& f, Tuples&&... t)
    -> decltype(detail::apply_tuple::call(
        detail::apply_tuple::makeCallable(std::forward<F>(f)),
        std::tuple_cat(detail::apply_tuple::forwardTuple(
            std::forward<Tuples>(t),
            detail::apply_tuple::MakeIndexSequenceFromTuple<Tuples>{})...),
        detail::apply_tuple::MakeIndexSequenceFromTuple<Tuples...>{})) {
  return detail::apply_tuple::call(
      detail::apply_tuple::makeCallable(std::forward<F>(f)),
      std::tuple_cat(detail::apply_tuple::forwardTuple(
          std::forward<Tuples>(t),
          detail::apply_tuple::MakeIndexSequenceFromTuple<Tuples>{})...),
      detail::apply_tuple::MakeIndexSequenceFromTuple<Tuples...>{});
}

//////////////////////////////////////////////////////////////////////
}
