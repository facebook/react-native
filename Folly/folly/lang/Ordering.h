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

namespace folly {

enum class ordering : int { lt = -1, eq = 0, gt = 1 };

template <typename T>
constexpr ordering to_ordering(T c) {
  return ordering(int(c < T(0)) * -1 + int(c > T(0)));
}

namespace detail {

template <typename C, ordering o, bool ne>
struct cmp_pred : private C {
  using C::C;

  template <typename A, typename B>
  constexpr bool operator()(A&& a, B&& b) const {
    return ne ^ (C::operator()(static_cast<A&&>(a), static_cast<B&&>(b)) == o);
  }
};

} // namespace detail

template <typename C>
struct compare_equal_to : detail::cmp_pred<C, ordering::eq, 0> {
  using detail::cmp_pred<C, ordering::eq, 0>::cmp_pred;
};

template <typename C>
struct compare_not_equal_to : detail::cmp_pred<C, ordering::eq, 1> {
  using detail::cmp_pred<C, ordering::eq, 1>::cmp_pred;
};

template <typename C>
struct compare_less : detail::cmp_pred<C, ordering::lt, 0> {
  using detail::cmp_pred<C, ordering::lt, 0>::cmp_pred;
};

template <typename C>
struct compare_less_equal : detail::cmp_pred<C, ordering::gt, 1> {
  using detail::cmp_pred<C, ordering::gt, 1>::cmp_pred;
};

template <typename C>
struct compare_greater : detail::cmp_pred<C, ordering::gt, 0> {
  using detail::cmp_pred<C, ordering::gt, 0>::cmp_pred;
};

template <typename C>
struct compare_greater_equal : detail::cmp_pred<C, ordering::lt, 1> {
  using detail::cmp_pred<C, ordering::lt, 1>::cmp_pred;
};

} // namespace folly
