/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/better.h>

#ifdef BETTER_USE_FOLLY_CONTAINERS

#include <folly/fbstring.h>

#else

#include <string>

#endif

namespace facebook {
namespace better {

#ifdef BETTER_USE_FOLLY_CONTAINERS

using string = folly::fbstring;

#else

using string = std::string;

#endif

} // namespace better
} // namespace facebook
