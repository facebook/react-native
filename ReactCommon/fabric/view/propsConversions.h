/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/propsConversions.h>
#include <fabric/view/conversions.h>

namespace facebook {
namespace react {

static std::array<YGValue, 2> convertRawProp(const RawProps &rawProps, const std::string &widthName, const std::string &heightName, const std::array<YGValue, 2> &defaultValue) {
  std::array<YGValue, 2> dimentions;
  dimentions[YGDimensionWidth] = convertRawProp(rawProps, widthName, defaultValue[YGDimensionWidth]);
  dimentions[YGDimensionHeight] = convertRawProp(rawProps, heightName, defaultValue[YGDimensionHeight]);
  return dimentions;
}

static std::array<YGValue, YGEdgeCount> convertRawProp(const RawProps &rawProps, const std::string &prefix, const std::array<YGValue, YGEdgeCount> &defaultValue) {
  std::array<YGValue, YGEdgeCount> result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(rawProps, prefix + "Left", defaultValue[YGEdgeLeft]);
  result[YGEdgeTop] = convertRawProp(rawProps, prefix + "Top", defaultValue[YGEdgeTop]);
  result[YGEdgeRight] = convertRawProp(rawProps, prefix + "Right", defaultValue[YGEdgeRight]);
  result[YGEdgeBottom] = convertRawProp(rawProps, prefix + "Bottom", defaultValue[YGEdgeBottom]);
  result[YGEdgeStart] = convertRawProp(rawProps, prefix + "Start", defaultValue[YGEdgeStart]);
  result[YGEdgeEnd] = convertRawProp(rawProps, prefix + "End", defaultValue[YGEdgeEnd]);
  result[YGEdgeHorizontal] = convertRawProp(rawProps, prefix + "Horizontal", defaultValue[YGEdgeHorizontal]);
  result[YGEdgeVertical] = convertRawProp(rawProps, prefix + "Vertical", defaultValue[YGEdgeVertical]);
  result[YGEdgeAll] = convertRawProp(rawProps, prefix, defaultValue[YGEdgeAll]);
  return result;
}

static std::array<YGValue, YGEdgeCount> convertRawProp(const RawProps &rawProps, const std::array<YGValue, YGEdgeCount> &defaultValue) {
  std::array<YGValue, YGEdgeCount> result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(rawProps, "left", defaultValue[YGEdgeLeft]);
  result[YGEdgeTop] = convertRawProp(rawProps, "top", defaultValue[YGEdgeTop]);
  result[YGEdgeRight] = convertRawProp(rawProps, "right", defaultValue[YGEdgeRight]);
  result[YGEdgeBottom] = convertRawProp(rawProps, "bottom", defaultValue[YGEdgeBottom]);
  result[YGEdgeStart] = convertRawProp(rawProps, "start", defaultValue[YGEdgeStart]);
  result[YGEdgeEnd] = convertRawProp(rawProps, "end", defaultValue[YGEdgeEnd]);
  return result;
}

static YGStyle convertRawProp(const RawProps &rawProps, const YGStyle &defaultValue) {
  YGStyle yogaStyle;
  yogaStyle.direction = convertRawProp(rawProps, "direction", defaultValue.direction);
  yogaStyle.flexDirection = convertRawProp(rawProps, "flexDirection", defaultValue.flexDirection);
  yogaStyle.justifyContent = convertRawProp(rawProps, "justifyContent", defaultValue.justifyContent);
  yogaStyle.alignContent = convertRawProp(rawProps, "alignContent", defaultValue.alignContent);
  yogaStyle.alignItems = convertRawProp(rawProps, "alignItems", defaultValue.alignItems);
  yogaStyle.alignSelf = convertRawProp(rawProps, "alignSelf", defaultValue.alignSelf);
  yogaStyle.positionType = convertRawProp(rawProps, "positionType", defaultValue.positionType);
  yogaStyle.flexWrap = convertRawProp(rawProps, "flexWrap", defaultValue.flexWrap);
  yogaStyle.overflow = convertRawProp(rawProps, "overflow", defaultValue.overflow);
  yogaStyle.display = convertRawProp(rawProps, "display", defaultValue.display);
  yogaStyle.flex = convertRawProp(rawProps, "flex", defaultValue.flex);
  yogaStyle.flexGrow = convertRawProp(rawProps, "flexGrow", defaultValue.flexGrow);
  yogaStyle.flexShrink = convertRawProp(rawProps, "flexShrink", defaultValue.flexShrink);
  yogaStyle.flexBasis = convertRawProp(rawProps, "flexBasis", defaultValue.flexBasis);
  yogaStyle.margin = convertRawProp(rawProps, "margin", defaultValue.margin);
  yogaStyle.position = convertRawProp(rawProps, defaultValue.position);
  yogaStyle.padding = convertRawProp(rawProps, "padding", defaultValue.padding);
  yogaStyle.border = convertRawProp(rawProps, "border", defaultValue.border);
  yogaStyle.dimensions = convertRawProp(rawProps, "width", "height", defaultValue.dimensions);
  yogaStyle.minDimensions = convertRawProp(rawProps, "minWidth", "minHeight", defaultValue.minDimensions);
  yogaStyle.maxDimensions = convertRawProp(rawProps, "maxWidth", "maxHeight", defaultValue.maxDimensions);
  yogaStyle.aspectRatio = convertRawProp(rawProps, "aspectRatio", defaultValue.aspectRatio);
  return yogaStyle;
}

} // namespace react
} // namespace facebook
