/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

namespace facebook::react {

template <
    typename T,
    typename... Rest,
    bool Enabled = !std::is_same<T, const char*>::value,
    typename = typename std::enable_if<Enabled>::type>
void hash_combine(std::size_t& seed, const T& v, const Rest&... rest) {
  seed ^= std::hash<T>{}(v) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
  (hash_combine(seed, rest), ...);
}

template <typename T, typename... Args>
std::size_t hash_combine(const T& v, const Args&... args) {
  std::size_t seed = 0;
  hash_combine<T, Args...>(seed, v, args...);
  return seed;
}

} // namespace facebook::react
