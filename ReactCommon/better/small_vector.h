/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/better.h>

// `folly::small_vector` is broken on some versions of Android.
#if defined(BETTER_USE_FOLLY_CONTAINERS) && !defined(ANDROID)

#include <folly/small_vector.h>

#else

#include <vector>

#endif

namespace facebook {
namespace better {

#if defined(BETTER_USE_FOLLY_CONTAINERS) && !defined(ANDROID)

template <typename T, std::size_t Size, typename... Ts>
using small_vector = folly::small_vector<T, Size, Ts...>;

#else

template <typename T, std::size_t Size, typename... Ts>
using small_vector = std::vector<T, Ts...>;

#endif

} // namespace better
} // namespace facebook
