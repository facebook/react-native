/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/SharedMutex.h>
#include <mutex>
#include <shared_mutex>

namespace facebook {
namespace better {

template <typename T>
using shared_lock = std::shared_lock<T>;

template <typename T>
using shared_mutex = folly::SharedMutex<T>;

} // namespace better
} // namespace facebook
