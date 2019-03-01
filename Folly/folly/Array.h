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

#include <folly/Traits.h>
#include <array>
#include <type_traits>
#include <utility>

namespace folly {

namespace array_detail {
template <typename>
struct is_ref_wrapper : std::false_type {};
template <typename T>
struct is_ref_wrapper<std::reference_wrapper<T>> : std::true_type {};

template <typename T>
using not_ref_wrapper =
    folly::Negation<is_ref_wrapper<typename std::decay<T>::type>>;

template <typename D, typename...>
struct return_type_helper {
  using type = D;
};
template <typename... TList>
struct return_type_helper<void, TList...> {
  static_assert(
      folly::Conjunction<not_ref_wrapper<TList>...>::value,
      "TList cannot contain reference_wrappers when D is void");
  using type = typename std::common_type<TList...>::type;
};

template <typename D, typename... TList>
using return_type = std::
    array<typename return_type_helper<D, TList...>::type, sizeof...(TList)>;
} // !array_detail

template <typename D = void, typename... TList>
constexpr array_detail::return_type<D, TList...> make_array(TList&&... t) {
  using value_type =
      typename array_detail::return_type_helper<D, TList...>::type;
  return {{static_cast<value_type>(std::forward<TList>(t))...}};
}

} // !folly
