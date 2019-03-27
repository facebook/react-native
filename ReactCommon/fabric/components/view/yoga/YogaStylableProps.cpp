/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaStylableProps.h"

#include <react/components/view/conversions.h>
#include <react/components/view/propsConversions.h>
#include <react/core/propsConversions.h>
#include <react/debug/debugStringConvertibleUtils.h>
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>

#include "conversions.h"

namespace facebook {
namespace react {

YogaStylableProps::YogaStylableProps(const YGStyle &yogaStyle)
    : yogaStyle(yogaStyle) {}

YogaStylableProps::YogaStylableProps(
    const YogaStylableProps &sourceProps,
    const RawProps &rawProps)
    : yogaStyle(convertRawProp(rawProps, sourceProps.yogaStyle)){};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  auto defaultYogaStyle = YGStyle{};
  return {
      debugStringConvertibleItem(
          "direction", yogaStyle.direction, defaultYogaStyle.direction),
      debugStringConvertibleItem(
          "flexDirection",
          yogaStyle.flexDirection,
          defaultYogaStyle.flexDirection),
      debugStringConvertibleItem(
          "justifyContent",
          yogaStyle.justifyContent,
          defaultYogaStyle.justifyContent),
      debugStringConvertibleItem(
          "alignContent",
          yogaStyle.alignContent,
          defaultYogaStyle.alignContent),
      debugStringConvertibleItem(
          "alignItems", yogaStyle.alignItems, defaultYogaStyle.alignItems),
      debugStringConvertibleItem(
          "alignSelf", yogaStyle.alignSelf, defaultYogaStyle.alignSelf),
      debugStringConvertibleItem(
          "positionType",
          yogaStyle.positionType,
          defaultYogaStyle.positionType),
      debugStringConvertibleItem(
          "flexWrap", yogaStyle.flexWrap, defaultYogaStyle.flexWrap),
      debugStringConvertibleItem(
          "overflow", yogaStyle.overflow, defaultYogaStyle.overflow),
      debugStringConvertibleItem(
          "display", yogaStyle.display, defaultYogaStyle.display),
      debugStringConvertibleItem("flex", yogaStyle.flex, defaultYogaStyle.flex),
      debugStringConvertibleItem(
          "flexGrow", yogaStyle.flexGrow, defaultYogaStyle.flexGrow),
      debugStringConvertibleItem(
          "flexShrink", yogaStyle.flexShrink, defaultYogaStyle.flexShrink),
      debugStringConvertibleItem(
          "flexBasis", yogaStyle.flexBasis, defaultYogaStyle.flexBasis),
      debugStringConvertibleItem(
          "margin", yogaStyle.margin, defaultYogaStyle.margin),
      debugStringConvertibleItem(
          "position", yogaStyle.position, defaultYogaStyle.position),
      debugStringConvertibleItem(
          "padding", yogaStyle.padding, defaultYogaStyle.padding),
      debugStringConvertibleItem(
          "border", yogaStyle.border, defaultYogaStyle.border),
      debugStringConvertibleItem(
          "dimensions", yogaStyle.dimensions, defaultYogaStyle.dimensions),
      debugStringConvertibleItem(
          "minDimensions",
          yogaStyle.minDimensions,
          defaultYogaStyle.minDimensions),
      debugStringConvertibleItem(
          "maxDimensions",
          yogaStyle.maxDimensions,
          defaultYogaStyle.maxDimensions),
      debugStringConvertibleItem(
          "aspectRatio", yogaStyle.aspectRatio, defaultYogaStyle.aspectRatio),
  };
}
#endif

} // namespace react
} // namespace facebook
