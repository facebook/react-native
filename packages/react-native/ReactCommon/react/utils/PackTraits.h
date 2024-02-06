/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <cstdint>
#include <type_traits>

namespace facebook::react::traits {

template <typename T, typename... RestT>
static constexpr size_t maxSizeof() {
  if constexpr (sizeof...(RestT) > 0) {
    return std::max(sizeof(T), maxSizeof<RestT...>());
  } else {
    return sizeof(T);
  }
}

template <typename ExpectedT>
static constexpr bool containsType() {
  return false;
}

template <typename ExpectedT, typename FirstT, typename... RestT>
static constexpr bool containsType() {
  if constexpr (sizeof...(RestT) > 0) {
    return std::is_same_v<ExpectedT, FirstT> ||
        containsType<ExpectedT, RestT...>();
  } else {
    return std::is_same_v<ExpectedT, FirstT>;
  }
}

} // namespace facebook::react::traits
