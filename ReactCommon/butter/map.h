/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/butter.h>

#ifdef BUTTER_USE_FOLLY_CONTAINERS

#include <folly/container/F14Map.h>

#else

#include <unordered_map>

#endif

namespace facebook {
namespace butter {

/*
 * Note: In Butter, `map` aliases to `unordered_map` because everyone agrees
 * that an *ordered* map is nonsense and was a huge mistake for standardization.
 * If you need an *ordered* map, feel free to introduce that as
 * `butter::ordered_map`.
 */

#ifdef BUTTER_USE_FOLLY_CONTAINERS

template <typename... Ts>
using map = folly::F14FastMap<Ts...>;

#else

template <typename... Ts>
using map = std::unordered_map<Ts...>;

#endif

} // namespace butter
} // namespace facebook
