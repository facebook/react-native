/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/better.h>

#ifdef BETTER_USE_FOLLY_CONTAINERS

#include <folly/fbvector.h>

#else

#include <vector>

#endif

namespace facebook {
namespace better {

#ifdef BETTER_USE_FOLLY_CONTAINERS

template <typename... Ts>
using vector = folly::fbvector<Ts...>;

#else

template <typename... Ts>
using vector = std::vector<Ts...>;

#endif

} // namespace better
} // namespace facebook
