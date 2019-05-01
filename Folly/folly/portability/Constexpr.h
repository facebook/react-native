/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/CPortability.h>

#include <cstdint>
#include <cstring>
#include <type_traits>

namespace folly {

namespace detail {

template <typename Char>
constexpr size_t constexpr_strlen_internal(const Char* s, size_t len) {
  // clang-format off
  return
      *(s + 0) == Char(0) ? len + 0 :
      *(s + 1) == Char(0) ? len + 1 :
      *(s + 2) == Char(0) ? len + 2 :
      *(s + 3) == Char(0) ? len + 3 :
      *(s + 4) == Char(0) ? len + 4 :
      *(s + 5) == Char(0) ? len + 5 :
      *(s + 6) == Char(0) ? len + 6 :
      *(s + 7) == Char(0) ? len + 7 :
      constexpr_strlen_internal(s + 8, len + 8);
  // clang-format on
}
static_assert(
    constexpr_strlen_internal("123456789", 0) == 9,
    "Someone appears to have broken constexpr_strlen...");

template <typename Char>
constexpr int constexpr_strcmp_internal(const Char* s1, const Char* s2) {
  return (*s1 == '\0' || *s1 != *s2)
      ? (static_cast<int>(*s1 - *s2))
      : constexpr_strcmp_internal(s1 + 1, s2 + 1);
}
} // namespace detail

template <typename Char>
constexpr size_t constexpr_strlen(const Char* s) {
  return detail::constexpr_strlen_internal(s, 0);
}

template <>
constexpr size_t constexpr_strlen(const char* s) {
#if FOLLY_HAS_FEATURE(cxx_constexpr_string_builtins)
  // clang provides a constexpr builtin
  return __builtin_strlen(s);
#elif defined(__GNUC__) && !defined(__clang__)
  // strlen() happens to already be constexpr under gcc
  return std::strlen(s);
#else
  return detail::constexpr_strlen_internal(s, 0);
#endif
}

template <typename Char>
constexpr int constexpr_strcmp(const Char* s1, const Char* s2) {
  return detail::constexpr_strcmp_internal(s1, s2);
}

template <>
constexpr int constexpr_strcmp(const char* s1, const char* s2) {
#if FOLLY_HAS_FEATURE(cxx_constexpr_string_builtins)
  // clang provides a constexpr builtin
  return __builtin_strcmp(s1, s2);
#elif defined(__GNUC__) && !defined(__clang__)
  // strcmp() happens to already be constexpr under gcc
  return std::strcmp(s1, s2);
#else
  return detail::constexpr_strcmp_internal(s1, s2);
#endif
}
} // namespace folly
