/*
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

static inline YGStyle::Dimensions convertRawProp(
    RawProps const &rawProps,
    char const *widthName,
    char const *heightName,
    YGStyle::Dimensions const &sourceValue,
    YGStyle::Dimensions const &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[YGDimensionWidth] = convertRawProp(
      rawProps,
      widthName,
      sourceValue[YGDimensionWidth],
      defaultValue[YGDimensionWidth]);
  dimensions[YGDimensionHeight] = convertRawProp(
      rawProps,
      heightName,
      sourceValue[YGDimensionHeight],
      defaultValue[YGDimensionWidth]);
  return dimensions;
}

static inline YGStyle::Edges convertRawProp(
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    YGStyle::Edges const &sourceValue,
    YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(
      rawProps,
      "Left",
      sourceValue[YGEdgeLeft],
      defaultValue[YGEdgeLeft],
      prefix,
      suffix);
  result[YGEdgeTop] = convertRawProp(
      rawProps,
      "Top",
      sourceValue[YGEdgeTop],
      defaultValue[YGEdgeTop],
      prefix,
      suffix);
  result[YGEdgeRight] = convertRawProp(
      rawProps,
      "Right",
      sourceValue[YGEdgeRight],
      defaultValue[YGEdgeRight],
      prefix,
      suffix);
  result[YGEdgeBottom] = convertRawProp(
      rawProps,
      "Bottom",
      sourceValue[YGEdgeBottom],
      defaultValue[YGEdgeBottom],
      prefix,
      suffix);
  result[YGEdgeStart] = convertRawProp(
      rawProps,
      "Start",
      sourceValue[YGEdgeStart],
      defaultValue[YGEdgeStart],
      prefix,
      suffix);
  result[YGEdgeEnd] = convertRawProp(
      rawProps,
      "End",
      sourceValue[YGEdgeEnd],
      defaultValue[YGEdgeEnd],
      prefix,
      suffix);
  result[YGEdgeHorizontal] = convertRawProp(
      rawProps,
      "Horizontal",
      sourceValue[YGEdgeHorizontal],
      defaultValue[YGEdgeHorizontal],
      prefix,
      suffix);
  result[YGEdgeVertical] = convertRawProp(
      rawProps,
      "Vertical",
      sourceValue[YGEdgeVertical],
      defaultValue[YGEdgeVertical],
      prefix,
      suffix);
  result[YGEdgeAll] = convertRawProp(
      rawProps,
      "",
      sourceValue[YGEdgeAll],
      defaultValue[YGEdgeAll],
      prefix,
      suffix);
  return result;
}

static inline YGStyle::Edges convertRawProp(
    RawProps const &rawProps,
    YGStyle::Edges const &sourceValue,
    YGStyle::Edges const &defaultValue) {
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
    RawProps const &rawProps,
    YGStyle const &sourceValue) {
  auto yogaStyle = YGStyle{};
  yogaStyle.direction() = convertRawProp(
      rawProps, "direction", sourceValue.direction(), yogaStyle.direction());
  yogaStyle.flexDirection() = convertRawProp(
      rawProps,
      "flexDirection",
      sourceValue.flexDirection(),
      yogaStyle.flexDirection());
  yogaStyle.justifyContent() = convertRawProp(
      rawProps,
      "justifyContent",
      sourceValue.justifyContent(),
      yogaStyle.justifyContent());
  yogaStyle.alignContent() = convertRawProp(
      rawProps,
      "alignContent",
      sourceValue.alignContent(),
      yogaStyle.alignContent());
  yogaStyle.alignItems() = convertRawProp(
      rawProps, "alignItems", sourceValue.alignItems(), yogaStyle.alignItems());
  yogaStyle.alignSelf() = convertRawProp(
      rawProps, "alignSelf", sourceValue.alignSelf(), yogaStyle.alignSelf());
  yogaStyle.positionType() = convertRawProp(
      rawProps,
      "position",
      sourceValue.positionType(),
      yogaStyle.positionType());
  yogaStyle.flexWrap() = convertRawProp(
      rawProps, "flexWrap", sourceValue.flexWrap(), yogaStyle.flexWrap());
  yogaStyle.overflow() = convertRawProp(
      rawProps, "overflow", sourceValue.overflow(), yogaStyle.overflow());
  yogaStyle.display() = convertRawProp(
      rawProps, "display", sourceValue.display(), yogaStyle.display());
  yogaStyle.flex() =
      convertRawProp(rawProps, "flex", sourceValue.flex(), yogaStyle.flex());
  yogaStyle.flexGrow() = convertRawProp(
      rawProps, "flexGrow", sourceValue.flexGrow(), yogaStyle.flexGrow());
  yogaStyle.flexShrink() = convertRawProp(
      rawProps, "flexShrink", sourceValue.flexShrink(), yogaStyle.flexShrink());
  yogaStyle.flexBasis() = convertRawProp(
      rawProps, "flexBasis", sourceValue.flexBasis(), yogaStyle.flexBasis());
  yogaStyle.margin() = convertRawProp(
      rawProps, "margin", "", sourceValue.margin(), yogaStyle.margin());
  yogaStyle.position() =
      convertRawProp(rawProps, sourceValue.position(), yogaStyle.position());
  yogaStyle.padding() = convertRawProp(
      rawProps, "padding", "", sourceValue.padding(), yogaStyle.padding());
  yogaStyle.border() = convertRawProp(
      rawProps, "border", "Width", sourceValue.border(), yogaStyle.border());
  yogaStyle.dimensions() = convertRawProp(
      rawProps,
      "width",
      "height",
      sourceValue.dimensions(),
      yogaStyle.dimensions());
  yogaStyle.minDimensions() = convertRawProp(
      rawProps,
      "minWidth",
      "minHeight",
      sourceValue.minDimensions(),
      yogaStyle.minDimensions());
  yogaStyle.maxDimensions() = convertRawProp(
      rawProps,
      "maxWidth",
      "maxHeight",
      sourceValue.maxDimensions(),
      yogaStyle.maxDimensions());
  yogaStyle.aspectRatio() = convertRawProp(
      rawProps,
      "aspectRatio",
      sourceValue.aspectRatio(),
      yogaStyle.aspectRatio());
  return yogaStyle;
}

template <typename T>
static inline CascadedRectangleCorners<T> convertRawProp(
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleCorners<T> const &sourceValue) {
  CascadedRectangleCorners<T> result;

  result.topLeft = convertRawProp(
      rawProps, "TopLeft", sourceValue.topLeft, {}, prefix, suffix);
  result.topRight = convertRawProp(
      rawProps, "TopRight", sourceValue.topRight, {}, prefix, suffix);
  result.bottomLeft = convertRawProp(
      rawProps, "BottomLeft", sourceValue.bottomLeft, {}, prefix, suffix);
  result.bottomRight = convertRawProp(
      rawProps, "BottomRight", sourceValue.bottomRight, {}, prefix, suffix);

  result.topStart = convertRawProp(
      rawProps, "TopStart", sourceValue.topStart, {}, prefix, suffix);
  result.topEnd = convertRawProp(
      rawProps, "TopEnd", sourceValue.topEnd, {}, prefix, suffix);
  result.bottomStart = convertRawProp(
      rawProps, "BottomStart", sourceValue.bottomStart, {}, prefix, suffix);
  result.bottomEnd = convertRawProp(
      rawProps, "BottomEnd", sourceValue.bottomEnd, {}, prefix, suffix);

  result.all =
      convertRawProp(rawProps, "", sourceValue.all, {}, prefix, suffix);

  return result;
}

template <typename T>
static inline CascadedRectangleEdges<T> convertRawProp(
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleEdges<T> const &sourceValue) {
  CascadedRectangleEdges<T> result;

  result.left =
      convertRawProp(rawProps, "Left", sourceValue.left, {}, prefix, suffix);
  result.right =
      convertRawProp(rawProps, "Right", sourceValue.right, {}, prefix, suffix);
  result.top =
      convertRawProp(rawProps, "Top", sourceValue.top, {}, prefix, suffix);
  result.bottom = convertRawProp(
      rawProps, "Bottom", sourceValue.bottom, {}, prefix, suffix);

  result.start =
      convertRawProp(rawProps, "Start", sourceValue.start, {}, prefix, suffix);
  result.end =
      convertRawProp(rawProps, "End", sourceValue.end, {}, prefix, suffix);
  result.horizontal = convertRawProp(
      rawProps, "Horizontal", sourceValue.horizontal, {}, prefix, suffix);
  result.vertical = convertRawProp(
      rawProps, "Vertical", sourceValue.vertical, {}, prefix, suffix);

  result.all =
      convertRawProp(rawProps, "", sourceValue.all, {}, prefix, suffix);

  return result;
}

} // namespace react
} // namespace facebook
