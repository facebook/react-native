/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/debug/debugStringConvertibleUtils.h>
#include <fabric/graphics/graphicValuesConversions.h>

namespace facebook {
namespace react {

DEBUG_STRING_CONVERTIBLE_TEMPLATE(Point, stringFromPoint)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(Size, stringFromSize)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(Rect, stringFromRect)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(SharedColor, colorNameFromColor)

} // namespace react
} // namespace facebook
