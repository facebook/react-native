/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <fabric/graphics/Color.h>

namespace facebook {
namespace react {

SharedColor colorFromDynamic(folly::dynamic value);
std::string colorNameFromColor(SharedColor value);

} // namespace react
} // namespace facebook
