/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/view/conversions.h>
#include <fabric/core/propsConversions.h>

namespace facebook {
namespace react {

static std::array<YGValue, 2> convertRawProp(
  const RawProps &rawProps,
  const std::string &widthName,
  const std::string &heightName,
  const std::array<YGValue, 2> &sourceValue,
  const std::array<YGValue, 2> &defaultValue
) {
  std::array<YGValue, 2> dimentions = defaultValue;
  dimentions[YGDimensionWidth] = convertRawProp(rawProps, widthName, sourceValue[YGDimensionWidth], defaultValue[YGDimensionWidth]);
  dimentions[YGDimensionHeight] = convertRawProp(rawProps, heightName, sourceValue[YGDimensionHeight], defaultValue[YGDimensionWidth]);
  return dimentions;
}

static std::array<YGValue, YGEdgeCount> convertRawProp(
  const RawProps &rawProps,
  const std::string &prefix,
  const std::array<YGValue, YGEdgeCount> &sourceValue,
  const std::array<YGValue, YGEdgeCount> &defaultValue
) {
  std::array<YGValue, YGEdgeCount> result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(rawProps, prefix + "Left", sourceValue[YGEdgeLeft], defaultValue[YGEdgeLeft]);
  result[YGEdgeTop] = convertRawProp(rawProps, prefix + "Top", sourceValue[YGEdgeTop], defaultValue[YGEdgeTop]);
  result[YGEdgeRight] = convertRawProp(rawProps, prefix + "Right", sourceValue[YGEdgeRight], defaultValue[YGEdgeRight]);
  result[YGEdgeBottom] = convertRawProp(rawProps, prefix + "Bottom", sourceValue[YGEdgeBottom], defaultValue[YGEdgeBottom]);
  result[YGEdgeStart] = convertRawProp(rawProps, prefix + "Start", sourceValue[YGEdgeStart], defaultValue[YGEdgeStart]);
  result[YGEdgeEnd] = convertRawProp(rawProps, prefix + "End", sourceValue[YGEdgeEnd], defaultValue[YGEdgeEnd]);
  result[YGEdgeHorizontal] = convertRawProp(rawProps, prefix + "Horizontal", sourceValue[YGEdgeHorizontal], defaultValue[YGEdgeHorizontal]);
  result[YGEdgeVertical] = convertRawProp(rawProps, prefix + "Vertical", sourceValue[YGEdgeVertical], defaultValue[YGEdgeVertical]);
  result[YGEdgeAll] = convertRawProp(rawProps, prefix, sourceValue[YGEdgeAll], defaultValue[YGEdgeAll]);
  return result;
}

static std::array<YGValue, YGEdgeCount> convertRawProp(
  const RawProps &rawProps,
  const std::array<YGValue, YGEdgeCount> &sourceValue,
  const std::array<YGValue, YGEdgeCount> &defaultValue
) {
  std::array<YGValue, YGEdgeCount> result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(rawProps, "left", sourceValue[YGEdgeLeft], defaultValue[YGEdgeLeft]);
  result[YGEdgeTop] = convertRawProp(rawProps, "top", sourceValue[YGEdgeTop], defaultValue[YGEdgeTop]);
  result[YGEdgeRight] = convertRawProp(rawProps, "right", sourceValue[YGEdgeRight], defaultValue[YGEdgeRight]);
  result[YGEdgeBottom] = convertRawProp(rawProps, "bottom", sourceValue[YGEdgeBottom], defaultValue[YGEdgeBottom]);
  result[YGEdgeStart] = convertRawProp(rawProps, "start", sourceValue[YGEdgeStart], defaultValue[YGEdgeStart]);
  result[YGEdgeEnd] = convertRawProp(rawProps, "end", sourceValue[YGEdgeEnd], defaultValue[YGEdgeEnd]);
  return result;
}

static YGStyle convertRawProp(const RawProps &rawProps, const YGStyle &sourceValue) {
  YGStyle yogaStyle;
  yogaStyle.direction = convertRawProp(rawProps, "direction", sourceValue.direction, yogaStyle.direction);
  yogaStyle.flexDirection = convertRawProp(rawProps, "flexDirection", sourceValue.flexDirection, yogaStyle.flexDirection);
  yogaStyle.justifyContent = convertRawProp(rawProps, "justifyContent", sourceValue.justifyContent, yogaStyle.justifyContent);
  yogaStyle.alignContent = convertRawProp(rawProps, "alignContent", sourceValue.alignContent, yogaStyle.alignContent);
  yogaStyle.alignItems = convertRawProp(rawProps, "alignItems", sourceValue.alignItems, yogaStyle.alignItems);
  yogaStyle.alignSelf = convertRawProp(rawProps, "alignSelf", sourceValue.alignSelf, yogaStyle.alignSelf);
  yogaStyle.positionType = convertRawProp(rawProps, "position", sourceValue.positionType, yogaStyle.positionType);
  yogaStyle.flexWrap = convertRawProp(rawProps, "flexWrap", sourceValue.flexWrap, yogaStyle.flexWrap);
  yogaStyle.overflow = convertRawProp(rawProps, "overflow", sourceValue.overflow, yogaStyle.overflow);
  yogaStyle.display = convertRawProp(rawProps, "display", sourceValue.display, yogaStyle.display);
  yogaStyle.flex = convertRawProp(rawProps, "flex", sourceValue.flex, yogaStyle.flex);
  yogaStyle.flexGrow = convertRawProp(rawProps, "flexGrow", sourceValue.flexGrow, yogaStyle.flexGrow);
  yogaStyle.flexShrink = convertRawProp(rawProps, "flexShrink", sourceValue.flexShrink, yogaStyle.flexShrink);
  yogaStyle.flexBasis = convertRawProp(rawProps, "flexBasis", sourceValue.flexBasis, yogaStyle.flexBasis);
  yogaStyle.margin = convertRawProp(rawProps, "margin", sourceValue.margin, yogaStyle.margin);
  yogaStyle.position = convertRawProp(rawProps, sourceValue.position, yogaStyle.position);
  yogaStyle.padding = convertRawProp(rawProps, "padding", sourceValue.padding, yogaStyle.padding);
  yogaStyle.border = convertRawProp(rawProps, "border", sourceValue.border, yogaStyle.border);
  yogaStyle.dimensions = convertRawProp(rawProps, "width", "height", sourceValue.dimensions, yogaStyle.dimensions);
  yogaStyle.minDimensions = convertRawProp(rawProps, "minWidth", "minHeight", sourceValue.minDimensions, yogaStyle.minDimensions);
  yogaStyle.maxDimensions = convertRawProp(rawProps, "maxWidth", "maxHeight", sourceValue.maxDimensions, yogaStyle.maxDimensions);
  yogaStyle.aspectRatio = convertRawProp(rawProps, "aspectRatio", sourceValue.aspectRatio, yogaStyle.aspectRatio);
  return yogaStyle;
}

} // namespace react
} // namespace facebook
