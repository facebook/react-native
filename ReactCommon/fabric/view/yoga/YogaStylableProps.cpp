/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaStylableProps.h"

#include <fabric/core/propsConversions.h>
#include <fabric/debug/DebugStringConvertibleItem.h>
#include <fabric/view/propsConversions.h>
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>

#include "yogaValuesConversions.h"

namespace facebook {
namespace react {

YogaStylableProps::YogaStylableProps(const YGStyle &yogaStyle):
  yogaStyle(yogaStyle) {}

YogaStylableProps::YogaStylableProps(const YogaStylableProps &sourceProps, const RawProps &rawProps):
  yogaStyle(convertRawProp(rawProps, sourceProps.yogaStyle)) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  SharedDebugStringConvertibleList list = {};

  YGStyle defaultYogaStyle = YGStyle();
  YGStyle currentYogaStyle = yogaStyle;

#define YOGA_STYLE_PROPS_ADD_TO_SET(stringName, propertyName, accessor, convertor) \
  { \
    auto currentValueString = convertor(currentYogaStyle.propertyName accessor); \
    auto defaultValueString = convertor(defaultYogaStyle.propertyName accessor); \
    if (currentValueString != defaultValueString) { \
      list.push_back(std::make_shared<DebugStringConvertibleItem>(#stringName, currentValueString)); \
    } \
  }

  YOGA_STYLE_PROPS_ADD_TO_SET(direction, direction, , stringFromYogaStyleDirection)

  YOGA_STYLE_PROPS_ADD_TO_SET(flexDirection, flexDirection, , stringFromYogaStyleFlexDirection)
  YOGA_STYLE_PROPS_ADD_TO_SET(justifyContent, justifyContent, , stringFromYogaStyleJustify)
  YOGA_STYLE_PROPS_ADD_TO_SET(alignItems, alignItems, , stringFromYogaStyleAlign)
  YOGA_STYLE_PROPS_ADD_TO_SET(alignSelf, alignSelf, , stringFromYogaStyleAlign)
  YOGA_STYLE_PROPS_ADD_TO_SET(positionType, positionType, , stringFromYogaStylePositionType)
  YOGA_STYLE_PROPS_ADD_TO_SET(flexWrap, flexWrap, , stringFromYogaStyleWrap)
  YOGA_STYLE_PROPS_ADD_TO_SET(overflow, overflow, , stringFromYogaStyleOverflow)

  YOGA_STYLE_PROPS_ADD_TO_SET(flex, flex, , stringFromYogaStyleOptionalFloat)
  YOGA_STYLE_PROPS_ADD_TO_SET(flexGrow, flexGrow, , stringFromYogaStyleOptionalFloat)
  YOGA_STYLE_PROPS_ADD_TO_SET(flexShrink, flexShrink, , stringFromYogaStyleOptionalFloat)
  YOGA_STYLE_PROPS_ADD_TO_SET(flexBasis, flexBasis, , stringFromYogaStyleValue)
  YOGA_STYLE_PROPS_ADD_TO_SET(margin, margin, , stringFromYogaStyleEdge)
  YOGA_STYLE_PROPS_ADD_TO_SET(position, position, , stringFromYogaStyleEdge)
  YOGA_STYLE_PROPS_ADD_TO_SET(padding, padding, , stringFromYogaStyleEdge)
  YOGA_STYLE_PROPS_ADD_TO_SET(border, border, , stringFromYogaStyleEdge)

  YOGA_STYLE_PROPS_ADD_TO_SET(size, dimensions, , stringFromYogaStyleDimensions)
  YOGA_STYLE_PROPS_ADD_TO_SET(minSize, minDimensions, , stringFromYogaStyleDimensions)
  YOGA_STYLE_PROPS_ADD_TO_SET(maxSize, maxDimensions, , stringFromYogaStyleDimensions)

  YOGA_STYLE_PROPS_ADD_TO_SET(aspectRatio, aspectRatio, , stringFromYogaStyleOptionalFloat)

  return list;
}

} // namespace react
} // namespace facebook
