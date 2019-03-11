/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/conversions.h>
#include <react/core/propsConversions.h>

namespace facebook {
namespace react {

static inline std::array<YGValue, 2> convertRawProp(
    const RawProps &rawProps,
    const std::string &widthName,
    const std::string &heightName,
    const std::array<YGValue, 2> &sourceValue,
    const std::array<YGValue, 2> &defaultValue) {
  auto dimentions = defaultValue;
  dimentions[YGDimensionWidth] = convertRawProp(
      rawProps,
      widthName,
      sourceValue[YGDimensionWidth],
      defaultValue[YGDimensionWidth]);
  dimentions[YGDimensionHeight] = convertRawProp(
      rawProps,
      heightName,
      sourceValue[YGDimensionHeight],
      defaultValue[YGDimensionWidth]);
  return dimentions;
}

static inline std::array<YGValue, YGEdgeCount> convertRawProp(
    const RawProps &rawProps,
    const std::string &prefix,
    const std::string &suffix,
    const std::array<YGValue, YGEdgeCount> &sourceValue,
    const std::array<YGValue, YGEdgeCount> &defaultValue) {
  auto result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(
      rawProps,
      prefix + "Left" + suffix,
      sourceValue[YGEdgeLeft],
      defaultValue[YGEdgeLeft]);
  result[YGEdgeTop] = convertRawProp(
      rawProps,
      prefix + "Top" + suffix,
      sourceValue[YGEdgeTop],
      defaultValue[YGEdgeTop]);
  result[YGEdgeRight] = convertRawProp(
      rawProps,
      prefix + "Right" + suffix,
      sourceValue[YGEdgeRight],
      defaultValue[YGEdgeRight]);
  result[YGEdgeBottom] = convertRawProp(
      rawProps,
      prefix + "Bottom" + suffix,
      sourceValue[YGEdgeBottom],
      defaultValue[YGEdgeBottom]);
  result[YGEdgeStart] = convertRawProp(
      rawProps,
      prefix + "Start" + suffix,
      sourceValue[YGEdgeStart],
      defaultValue[YGEdgeStart]);
  result[YGEdgeEnd] = convertRawProp(
      rawProps,
      prefix + "End" + suffix,
      sourceValue[YGEdgeEnd],
      defaultValue[YGEdgeEnd]);
  result[YGEdgeHorizontal] = convertRawProp(
      rawProps,
      prefix + "Horizontal" + suffix,
      sourceValue[YGEdgeHorizontal],
      defaultValue[YGEdgeHorizontal]);
  result[YGEdgeVertical] = convertRawProp(
      rawProps,
      prefix + "Vertical" + suffix,
      sourceValue[YGEdgeVertical],
      defaultValue[YGEdgeVertical]);
  result[YGEdgeAll] = convertRawProp(
      rawProps,
      prefix + suffix,
      sourceValue[YGEdgeAll],
      defaultValue[YGEdgeAll]);
  return result;
}

static inline std::array<YGValue, YGEdgeCount> convertRawProp(
    const RawProps &rawProps,
    const std::array<YGValue, YGEdgeCount> &sourceValue,
    const std::array<YGValue, YGEdgeCount> &defaultValue) {
  auto result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(
      rawProps, "left", sourceValue[YGEdgeLeft], defaultValue[YGEdgeLeft]);
  result[YGEdgeTop] = convertRawProp(
      rawProps, "top", sourceValue[YGEdgeTop], defaultValue[YGEdgeTop]);
  result[YGEdgeRight] = convertRawProp(
      rawProps, "right", sourceValue[YGEdgeRight], defaultValue[YGEdgeRight]);
  result[YGEdgeBottom] = convertRawProp(
      rawProps,
      "bottom",
      sourceValue[YGEdgeBottom],
      defaultValue[YGEdgeBottom]);
  result[YGEdgeStart] = convertRawProp(
      rawProps, "start", sourceValue[YGEdgeStart], defaultValue[YGEdgeStart]);
  result[YGEdgeEnd] = convertRawProp(
      rawProps, "end", sourceValue[YGEdgeEnd], defaultValue[YGEdgeEnd]);
  return result;
}

static inline YGStyle convertRawProp(
    const RawProps &rawProps,
    const YGStyle &sourceValue) {
  auto yogaStyle = YGStyle{};
  yogaStyle.direction = convertRawProp(
      rawProps, "direction", sourceValue.direction, yogaStyle.direction);
  yogaStyle.flexDirection = convertRawProp(
      rawProps,
      "flexDirection",
      sourceValue.flexDirection,
      yogaStyle.flexDirection);
  yogaStyle.justifyContent = convertRawProp(
      rawProps,
      "justifyContent",
      sourceValue.justifyContent,
      yogaStyle.justifyContent);
  yogaStyle.alignContent = convertRawProp(
      rawProps,
      "alignContent",
      sourceValue.alignContent,
      yogaStyle.alignContent);
  yogaStyle.alignItems = convertRawProp(
      rawProps, "alignItems", sourceValue.alignItems, yogaStyle.alignItems);
  yogaStyle.alignSelf = convertRawProp(
      rawProps, "alignSelf", sourceValue.alignSelf, yogaStyle.alignSelf);
  yogaStyle.positionType = convertRawProp(
      rawProps, "position", sourceValue.positionType, yogaStyle.positionType);
  yogaStyle.flexWrap = convertRawProp(
      rawProps, "flexWrap", sourceValue.flexWrap, yogaStyle.flexWrap);
  yogaStyle.overflow = convertRawProp(
      rawProps, "overflow", sourceValue.overflow, yogaStyle.overflow);
  yogaStyle.display = convertRawProp(
      rawProps, "display", sourceValue.display, yogaStyle.display);
  yogaStyle.flex =
      convertRawProp(rawProps, "flex", sourceValue.flex, yogaStyle.flex);
  yogaStyle.flexGrow = convertRawProp(
      rawProps, "flexGrow", sourceValue.flexGrow, yogaStyle.flexGrow);
  yogaStyle.flexShrink = convertRawProp(
      rawProps, "flexShrink", sourceValue.flexShrink, yogaStyle.flexShrink);
  yogaStyle.flexBasis = convertRawProp(
      rawProps, "flexBasis", sourceValue.flexBasis, yogaStyle.flexBasis);
  yogaStyle.margin = convertRawProp(
      rawProps, "margin", "", sourceValue.margin, yogaStyle.margin);
  yogaStyle.position =
      convertRawProp(rawProps, sourceValue.position, yogaStyle.position);
  yogaStyle.padding = convertRawProp(
      rawProps, "padding", "", sourceValue.padding, yogaStyle.padding);
  yogaStyle.border = convertRawProp(
      rawProps, "border", "Width", sourceValue.border, yogaStyle.border);
  yogaStyle.dimensions = convertRawProp(
      rawProps,
      "width",
      "height",
      sourceValue.dimensions,
      yogaStyle.dimensions);
  yogaStyle.minDimensions = convertRawProp(
      rawProps,
      "minWidth",
      "minHeight",
      sourceValue.minDimensions,
      yogaStyle.minDimensions);
  yogaStyle.maxDimensions = convertRawProp(
      rawProps,
      "maxWidth",
      "maxHeight",
      sourceValue.maxDimensions,
      yogaStyle.maxDimensions);
  yogaStyle.aspectRatio = convertRawProp(
      rawProps, "aspectRatio", sourceValue.aspectRatio, yogaStyle.aspectRatio);
  return yogaStyle;
}

template <typename T>
static inline CascadedRectangleCorners<T> convertRawProp(
    const RawProps &rawProps,
    const std::string &prefix,
    const std::string &suffix,
    const CascadedRectangleCorners<T> &sourceValue) {
  CascadedRectangleCorners<T> result;

  result.topLeft = convertRawProp(
      rawProps, prefix + "TopLeft" + suffix, sourceValue.topLeft);
  result.topRight = convertRawProp(
      rawProps, prefix + "TopRight" + suffix, sourceValue.topRight);
  result.bottomLeft = convertRawProp(
      rawProps, prefix + "BottomLeft" + suffix, sourceValue.bottomLeft);
  result.bottomRight = convertRawProp(
      rawProps, prefix + "BottomRight" + suffix, sourceValue.bottomRight);

  result.topStart = convertRawProp(
      rawProps, prefix + "TopStart" + suffix, sourceValue.topStart);
  result.topEnd =
      convertRawProp(rawProps, prefix + "TopEnd" + suffix, sourceValue.topEnd);
  result.bottomStart = convertRawProp(
      rawProps, prefix + "BottomStart" + suffix, sourceValue.bottomStart);
  result.bottomEnd = convertRawProp(
      rawProps, prefix + "BottomEnd" + suffix, sourceValue.bottomEnd);

  result.all = convertRawProp(rawProps, prefix + suffix, sourceValue.all);

  return result;
}

template <typename T>
static inline CascadedRectangleEdges<T> convertRawProp(
    const RawProps &rawProps,
    const std::string &prefix,
    const std::string &suffix,
    const CascadedRectangleEdges<T> &sourceValue) {
  CascadedRectangleEdges<T> result;

  result.left =
      convertRawProp(rawProps, prefix + "Left" + suffix, sourceValue.left);
  result.right =
      convertRawProp(rawProps, prefix + "Right" + suffix, sourceValue.right);
  result.top =
      convertRawProp(rawProps, prefix + "Top" + suffix, sourceValue.top);
  result.bottom =
      convertRawProp(rawProps, prefix + "Bottom" + suffix, sourceValue.bottom);

  result.start =
      convertRawProp(rawProps, prefix + "Start" + suffix, sourceValue.start);
  result.end =
      convertRawProp(rawProps, prefix + "End" + suffix, sourceValue.end);
  result.horizontal = convertRawProp(
      rawProps, prefix + "Horizontal" + suffix, sourceValue.horizontal);
  result.vertical = convertRawProp(
      rawProps, prefix + "Vertical" + suffix, sourceValue.vertical);

  result.all = convertRawProp(rawProps, prefix + suffix, sourceValue.all);

  return result;
}

} // namespace react
} // namespace facebook
