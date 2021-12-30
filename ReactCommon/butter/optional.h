/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/butter.h>

#if defined(BUTTER_USE_FOLLY_CONTAINERS) || __cplusplus < 202000L

#include <folly/Optional.h>

#else

#include <optional>

#endif

namespace facebook {
namespace butter {

#if defined(BUTTER_USE_FOLLY_CONTAINERS) || __cplusplus < 202000L

template <typename Value>
using optional = folly::Optional<Value>;

#else

template <typename Value>
using optional = std::optional<Value>;

#endif

} // namespace butter
} // namespace facebook
