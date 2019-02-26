/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/better.h>

#ifdef BETTER_USE_FOLLY_CONTAINERS

#include <folly/container/F14Set.h>

#else

#include <unordered_set>

#endif

namespace facebook {
namespace better {

#ifdef BETTER_USE_FOLLY_CONTAINERS

template <typename... Ts>
using set = folly::F14FastSet<Ts...>;

#else

template <typename... Ts>
using set = std::unordered_set<Ts...>;

#endif

} // namespace better
} // namespace facebook
