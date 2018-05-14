/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/debug/debugStringConvertibleUtils.h>
#include <fabric/view/yogaValuesConversions.h>

// Yoga does not have this as part of the library, so we have to implement it
// here ouside of `facebook::react::` namespace.
inline bool operator==(const YGValue &lhs, const YGValue &rhs) {
  if (
    (lhs.unit == YGUnitUndefined && rhs.unit == YGUnitUndefined) ||
    (lhs.unit == YGUnitAuto && rhs.unit == YGUnitAuto)
  ) {
    return true;
  }

  return
    lhs.unit == rhs.unit &&
    ((isnan(lhs.value) && isnan(rhs.value)) || (lhs.value == rhs.value));
}

namespace facebook {
namespace react {

using YogaDimentionsType = std::array<YGValue, YGDimensionCount>;
using YogaEdgesType = std::array<YGValue, YGEdgeCount>;

DEBUG_STRING_CONVERTIBLE_TEMPLATE(YogaDimentionsType, stringFromYogaStyleDimensions)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YogaEdgesType, stringFromYogaStyleEdges)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGDirection, stringFromYogaStyleDirection)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGFlexDirection, stringFromYogaStyleFlexDirection)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGJustify, stringFromYogaStyleJustify)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGAlign, stringFromYogaStyleAlign)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGPositionType, stringFromYogaStylePositionType)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGWrap, stringFromYogaStyleWrap)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGOverflow, stringFromYogaStyleOverflow)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGDisplay, stringFromYogaStyleDisplay)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(YGValue, stringFromYogaStyleValue)
DEBUG_STRING_CONVERTIBLE_TEMPLATE_EX(YGFloatOptional, stringFromYogaStyleOptionalFloat, YGFloatOptional(), IS_EQUAL)

} // namespace react
} // namespace facebook
