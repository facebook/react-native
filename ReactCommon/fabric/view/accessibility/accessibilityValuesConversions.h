/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <fabric/view/AccessibilityPrimitives.h>

namespace facebook {
namespace react {

AccessibilityTraits accessibilityTraitsFromDynamic(const folly::dynamic &value);

} // namespace react
} // namespace facebook
