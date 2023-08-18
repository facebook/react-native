/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/butter.h>

#ifdef BUTTER_USE_FOLLY_CONTAINERS

#include <folly/container/F14Set.h>

#else

#include <unordered_set>

#endif

namespace facebook {
namespace butter {

#ifdef BUTTER_USE_FOLLY_CONTAINERS

template <typename... Ts>
using set = folly::F14FastSet<Ts...>;

#else

template <typename... Ts>
using set = std::unordered_set<Ts...>;

#endif

} // namespace butter
} // namespace facebook
