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

#include <initializer_list>
#include <iterator>

/**
 *  include or backport:
 *  * std::size
 *  * std::empty
 *  * std::data
 */

#if __cpp_lib_nonmember_container_access >= 201411 || _MSC_VER

namespace folly {

/* using override */ using std::data;
/* using override */ using std::empty;
/* using override */ using std::size;

} // namespace folly

#else

namespace folly {

//  mimic: std::size, C++17
template <typename C>
constexpr auto size(C const& c) -> decltype(c.size()) {
  return c.size();
}
template <typename T, std::size_t N>
constexpr std::size_t size(T const (&)[N]) noexcept {
  return N;
}

//  mimic: std::empty, C++17
template <typename C>
constexpr auto empty(C const& c) -> decltype(c.empty()) {
  return c.empty();
}
template <typename T, std::size_t N>
constexpr bool empty(T const (&)[N]) noexcept {
  //  while zero-length arrays are not allowed in the language, some compilers
  //  may permit them in some cases
  return N == 0;
}
template <typename E>
constexpr bool empty(std::initializer_list<E> il) noexcept {
  return il.size() == 0;
}

//  mimic: std::data, C++17
template <typename C>
constexpr auto data(C& c) -> decltype(c.data()) {
  return c.data();
}
template <typename C>
constexpr auto data(C const& c) -> decltype(c.data()) {
  return c.data();
}
template <typename T, std::size_t N>
constexpr T* data(T (&a)[N]) noexcept {
  return a;
}
template <typename E>
constexpr E const* data(std::initializer_list<E> il) noexcept {
  return il.begin();
}

} // namespace folly

#endif
