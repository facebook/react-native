/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/SharedMutex.h>
#include <mutex>
#include <shared_mutex>

namespace facebook {
namespace butter {

using shared_mutex = folly::SharedMutex;

} // namespace butter
} // namespace facebook
