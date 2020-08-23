/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/better.h>

#ifdef BETTER_USE_FOLLY_CONTAINERS

#include <folly/container/F14Map.h>

#else

#include <unordered_map>

#endif

namespace facebook {
namespace better {

/*
 * Note: In Better, `map` aliases to `unorderd_map` because everyone agrees that
 * an *ordered* map is nonsense and was a huge mistake for standardization. If
 * you need an *ordered* map, feel free to introduce that as
 * `better::ordered_map`.
 */

#ifdef BETTER_USE_FOLLY_CONTAINERS

template <typename... Ts>
using map = folly::F14FastMap<Ts...>;

#else

template <typename... Ts>
using map = std::unordered_map<Ts...>;

#endif

} // namespace better
} // namespace facebook
