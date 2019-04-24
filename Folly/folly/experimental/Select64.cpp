/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/experimental/Select64.h>

#include <cstdint>

#include <folly/ConstexprMath.h>
#include <folly/Portability.h>
#include <folly/Utility.h>

namespace folly {
namespace detail {

namespace {

constexpr std::uint8_t selectInByte(std::size_t i, std::size_t j) {
  auto r = std::uint8_t(0);
  while (j--) {
    auto const s = folly::constexpr_find_first_set(i);
    r += s;
    i >>= s;
  }
  return i == 0 ? 8 : r + folly::constexpr_find_first_set(i) - 1;
}

template <std::size_t... I, std::size_t J>
constexpr auto makeSelectInByteNestedArray(
    index_sequence<I...>,
    index_constant<J>) {
  return std::array<std::uint8_t, sizeof...(I)>{{selectInByte(I, J)...}};
}

template <typename Is, std::size_t... J>
constexpr auto makeSelectInByteArray(Is is, index_sequence<J...>) {
  using inner = std::array<std::uint8_t, Is::size()>;
  using outer = std::array<inner, sizeof...(J)>;
  return outer{{makeSelectInByteNestedArray(is, index_constant<J>{})...}};
}

} // namespace

FOLLY_STORAGE_CONSTEXPR std::array<std::array<std::uint8_t, 256>, 8> const
    kSelectInByte = makeSelectInByteArray(
        make_index_sequence<256>{},
        make_index_sequence<8>{});

} // namespace detail
} // namespace folly
