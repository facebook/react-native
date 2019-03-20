/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/better.h>

#ifdef BETTER_USE_FOLLY_CONTAINERS

#include <folly/Optional.h>

#else

#include <optional>

#endif

namespace facebook {
namespace better {

#ifdef BETTER_USE_FOLLY_CONTAINERS

template <typename Value>
using optional = folly::Optional<Value>;

#else

template <typename Value>
using optional = std::optional<Value>;

#endif

} // namespace better
} // namespace facebook
