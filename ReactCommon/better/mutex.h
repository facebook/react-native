/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/SharedMutex.h>
#include <shared_mutex>
#include <mutex>

namespace facebook {
namespace better {

using shared_mutex = folly::SharedMutex;

} // namespace better
} // namespace facebook
