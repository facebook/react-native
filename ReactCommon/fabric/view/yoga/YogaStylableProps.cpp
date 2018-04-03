/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaStylableProps.h"

#include <yoga/Yoga.h>
#include <yoga/YGNode.h>

#include <fabric/debug/DebugStringConvertibleItem.h>

#include "yogaValuesConversions.h"

namespace facebook {
namespace react {

const YGStyle &YogaStylableProps::getYogaStyle() const {
  return yogaStyle_;
}

void YogaStylableProps::apply(const RawProps &rawProps) {
  for (auto const &pair : rawProps) {
    auto const &name = pair.first;
    auto const &value = pair.second;

#define YOGA_STYLE_PROPERTY(stringName, yogaName, accessor, convertor) \
  if (name == #stringName) { \
    yogaStyle_.yogaName = convertor(value accessor); \
    continue; \
  }

#define YOGA_STYLE_SIMPLE_FLOAT_PROPERTY(name) \
  YOGA_STYLE_PROPERTY(name, name, .asDouble(), )

#define YOGA_STYLE_OPTIONAL_FLOAT_PROPERTY(name) \
  YOGA_STYLE_PROPERTY(name, name, .asDouble(), yogaOptionalFloatFromFabricFloat)

#define YOGA_STYLE_SIMPLE_INTEGER_PROPERTY(name) \
  YOGA_STYLE_PROPERTY(name, name, .asInt(), )

// Dimension Properties
#define YOGA_STYLE_DIMENSION_PROPERTY() \
  YOGA_STYLE_PROPERTY(width, dimensions[YGDimensionWidth], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(height, dimensions[YGDimensionHeight], , yogaStyleValueFromDynamic)

#define YOGA_STYLE_PREFIXED_DIMENSION_PROPERTY(prefix) \
  YOGA_STYLE_PROPERTY(prefix##Width, prefix##Dimensions[YGDimensionWidth], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##Height, prefix##Dimensions[YGDimensionHeight], , yogaStyleValueFromDynamic)

// Edge Properties
#define YOGA_STYLE_POSITION_EDGE_PROPERTY() \
  YOGA_STYLE_PROPERTY(left, position[YGEdgeLeft], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(top, position[YGEdgeTop], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(right, position[YGEdgeRight], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(bottom, position[YGEdgeBottom], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(start, position[YGEdgeStart], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(end, position[YGEdgeEnd], , yogaStyleValueFromDynamic)

#define YOGA_STYLE_PREFIXED_EDGE_PROPERTY(prefix) \
  YOGA_STYLE_PROPERTY(prefix##Left, prefix[YGEdgeLeft], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##Top, prefix[YGEdgeTop], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##Right, prefix[YGEdgeRight], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##Bottom, prefix[YGEdgeBottom], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##Start, prefix[YGEdgeStart], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##End, prefix[YGEdgeEnd], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##Horizontal, prefix[YGEdgeHorizontal], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix##Vertical, prefix[YGEdgeVertical], , yogaStyleValueFromDynamic) \
  YOGA_STYLE_PROPERTY(prefix, prefix[YGEdgeAll], , yogaStyleValueFromDynamic)

    YOGA_STYLE_PROPERTY(direction, direction, , yogaStyleDirectionFromDynamic)
    YOGA_STYLE_PROPERTY(flexDirection, flexDirection, , yogaStyleFlexDirectionFromDynamic)
    YOGA_STYLE_PROPERTY(justifyContent, justifyContent, , yogaStyleJustifyFromDynamic)
    YOGA_STYLE_PROPERTY(alignContent, alignContent, , yogaStyleAlignFromDynamic)
    YOGA_STYLE_PROPERTY(alignItems, alignItems, , yogaStyleAlignFromDynamic)
    YOGA_STYLE_PROPERTY(alignSelf, alignSelf, , yogaStyleAlignFromDynamic)
    YOGA_STYLE_PROPERTY(positionType, positionType, , yogaStylePositionTypeFromDynamic)
    YOGA_STYLE_PROPERTY(flexWrap, flexWrap, , yogaStyleWrapFromDynamic)
    YOGA_STYLE_PROPERTY(overflow, overflow, , yogaStyleOverflowFromDynamic)
    YOGA_STYLE_PROPERTY(display, display, , yogaStyleDisplayFromDynamic)

    YOGA_STYLE_OPTIONAL_FLOAT_PROPERTY(flex)
    YOGA_STYLE_OPTIONAL_FLOAT_PROPERTY(flexGrow)
    YOGA_STYLE_OPTIONAL_FLOAT_PROPERTY(flexShrink)
    YOGA_STYLE_PROPERTY(flexBasis, flexBasis, , yogaStyleValueFromDynamic)

    YOGA_STYLE_DIMENSION_PROPERTY()
    YOGA_STYLE_PREFIXED_DIMENSION_PROPERTY(min)
    YOGA_STYLE_PREFIXED_DIMENSION_PROPERTY(max)

    YOGA_STYLE_POSITION_EDGE_PROPERTY()
    YOGA_STYLE_PREFIXED_EDGE_PROPERTY(margin)
    YOGA_STYLE_PREFIXED_EDGE_PROPERTY(padding)
    YOGA_STYLE_PREFIXED_EDGE_PROPERTY(border)

    YOGA_STYLE_OPTIONAL_FLOAT_PROPERTY(aspectRatio)
  }
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  SharedDebugStringConvertibleList list = {};

  YGStyle defaultYogaStyle = YGStyle();
  YGStyle currentYogaStyle = yogaStyle_;

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
