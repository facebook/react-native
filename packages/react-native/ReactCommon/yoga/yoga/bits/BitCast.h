/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstring>
#include <type_traits>

namespace facebook::yoga {

// Polyfill for std::bit_cast() from C++20, to allow safe type punning
// https://en.cppreference.com/w/cpp/numeric/bit_cast
// TODO: Remove when we upgrade to NDK 26+
template <class To, class From>
std::enable_if_t<
    sizeof(To) == sizeof(From) && std::is_trivially_copyable_v<From> &&
        std::is_trivially_copyable_v<To> &&
        std::is_trivially_constructible_v<To>,
    To>
bit_cast(const From& src) noexcept {
  To dst;
  std::memcpy(&dst, &src, sizeof(To));
  return dst;
}

} // namespace facebook::yoga
