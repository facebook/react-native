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

#include <cstdint>
#include <cstring>
#include <type_traits>

namespace folly {

// TLDR: Prefer using operator< for ordering. And when
// a and b are equivalent objects, we return b to make
// sorting stable.
// See http://stepanovpapers.com/notes.pdf for details.
template <typename T>
constexpr T constexpr_max(T a, T b) {
  return b < a ? a : b;
}

// When a and b are equivalent objects, we return a to
// make sorting stable.
template <typename T>
constexpr T constexpr_min(T a, T b) {
  return b < a ? b : a;
}

namespace detail {

template <typename T, typename = void>
struct constexpr_abs_helper {};

template <typename T>
struct constexpr_abs_helper<
    T,
    typename std::enable_if<std::is_floating_point<T>::value>::type> {
  static constexpr T go(T t) {
    return t < static_cast<T>(0) ? -t : t;
  }
};

template <typename T>
struct constexpr_abs_helper<
    T,
    typename std::enable_if<
        std::is_integral<T>::value && !std::is_same<T, bool>::value &&
        std::is_unsigned<T>::value>::type> {
  static constexpr T go(T t) {
    return t;
  }
};

template <typename T>
struct constexpr_abs_helper<
    T,
    typename std::enable_if<
        std::is_integral<T>::value && !std::is_same<T, bool>::value &&
        std::is_signed<T>::value>::type> {
  static constexpr typename std::make_unsigned<T>::type go(T t) {
    return typename std::make_unsigned<T>::type(t < static_cast<T>(0) ? -t : t);
  }
};
} // namespace detail

template <typename T>
constexpr auto constexpr_abs(T t)
    -> decltype(detail::constexpr_abs_helper<T>::go(t)) {
  return detail::constexpr_abs_helper<T>::go(t);
}

namespace detail {

template <typename Char>
constexpr size_t constexpr_strlen_internal(const Char* s, size_t len) {
  return *s == Char(0) ? len : constexpr_strlen_internal(s + 1, len + 1);
}
static_assert(constexpr_strlen_internal("123456789", 0) == 9,
              "Someone appears to have broken constexpr_strlen...");
} // namespace detail

template <typename Char>
constexpr size_t constexpr_strlen(const Char* s) {
  return detail::constexpr_strlen_internal(s, 0);
}

template <>
constexpr size_t constexpr_strlen(const char* s) {
#if defined(__clang__)
  return __builtin_strlen(s);
#elif defined(_MSC_VER)
  return detail::constexpr_strlen_internal(s, 0);
#else
  return std::strlen(s);
#endif
}
}
