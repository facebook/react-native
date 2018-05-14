/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/debug/debugStringConvertibleUtils.h>
#include <fabric/core/layoutValuesConversions.h>

namespace facebook {
namespace react {

DEBUG_STRING_CONVERTIBLE_TEMPLATE(LayoutDirection, stringFromLayoutDirection)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(DisplayType, stringFromDisplayType)

} // namespace react
} // namespace facebook
