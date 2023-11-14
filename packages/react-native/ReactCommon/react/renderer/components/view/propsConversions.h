/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>

#include <optional>

namespace facebook::react {

// Nearly this entire file can be deleted when iterator-style Prop parsing
// ships fully for View

static inline yoga::Style convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const yoga::Style& sourceValue) {
  yoga::Style yogaStyle{};
  yogaStyle.direction() = convertRawProp(
      context,
      rawProps,
      "direction",
      sourceValue.direction(),
      yogaStyle.direction());
  yogaStyle.flexDirection() = convertRawProp(
      context,
      rawProps,
      "flexDirection",
      sourceValue.flexDirection(),
      yogaStyle.flexDirection());
  yogaStyle.justifyContent() = convertRawProp(
      context,
      rawProps,
      "justifyContent",
      sourceValue.justifyContent(),
      yogaStyle.justifyContent());
  yogaStyle.alignContent() = convertRawProp(
      context,
      rawProps,
      "alignContent",
      sourceValue.alignContent(),
      yogaStyle.alignContent());
  yogaStyle.alignItems() = convertRawProp(
      context,
      rawProps,
      "alignItems",
      sourceValue.alignItems(),
      yogaStyle.alignItems());
  yogaStyle.alignSelf() = convertRawProp(
      context,
      rawProps,
      "alignSelf",
      sourceValue.alignSelf(),
      yogaStyle.alignSelf());
  yogaStyle.positionType() = convertRawProp(
      context,
      rawProps,
      "position",
      sourceValue.positionType(),
      yogaStyle.positionType());
  yogaStyle.flexWrap() = convertRawProp(
      context,
      rawProps,
      "flexWrap",
      sourceValue.flexWrap(),
      yogaStyle.flexWrap());
  yogaStyle.overflow() = convertRawProp(
      context,
      rawProps,
      "overflow",
      sourceValue.overflow(),
      yogaStyle.overflow());
  yogaStyle.display() = convertRawProp(
      context, rawProps, "display", sourceValue.display(), yogaStyle.display());
  yogaStyle.flex() = convertRawProp(
      context, rawProps, "flex", sourceValue.flex(), yogaStyle.flex());
  yogaStyle.flexGrow() = convertRawProp(
      context,
      rawProps,
      "flexGrow",
      sourceValue.flexGrow(),
      yogaStyle.flexGrow());
  yogaStyle.flexShrink() = convertRawProp(
      context,
      rawProps,
      "flexShrink",
      sourceValue.flexShrink(),
      yogaStyle.flexShrink());
  yogaStyle.flexBasis() = convertRawProp(
      context,
      rawProps,
      "flexBasis",
      sourceValue.flexBasis(),
      yogaStyle.flexBasis());

  yogaStyle.setMargin(
      YGEdgeLeft,
      convertRawProp(
          context,
          rawProps,
          "marginLeft",
          sourceValue.margin(YGEdgeLeft),
          yogaStyle.margin(YGEdgeLeft)));

  yogaStyle.setMargin(
      YGEdgeTop,
      convertRawProp(
          context,
          rawProps,
          "marginTop",
          sourceValue.margin(YGEdgeTop),
          yogaStyle.margin(YGEdgeTop)));

  yogaStyle.setMargin(
      YGEdgeRight,
      convertRawProp(
          context,
          rawProps,
          "marginRight",
          sourceValue.margin(YGEdgeRight),
          yogaStyle.margin(YGEdgeRight)));

  yogaStyle.setMargin(
      YGEdgeBottom,
      convertRawProp(
          context,
          rawProps,
          "marginBottom",
          sourceValue.margin(YGEdgeBottom),
          yogaStyle.margin(YGEdgeBottom)));

  yogaStyle.setMargin(
      YGEdgeStart,
      convertRawProp(
          context,
          rawProps,
          "marginStart",
          sourceValue.margin(YGEdgeStart),
          yogaStyle.margin(YGEdgeStart)));

  yogaStyle.setMargin(
      YGEdgeEnd,
      convertRawProp(
          context,
          rawProps,
          "marginEnd",
          sourceValue.margin(YGEdgeEnd),
          yogaStyle.margin(YGEdgeEnd)));

  yogaStyle.setMargin(
      YGEdgeHorizontal,
      convertRawProp(
          context,
          rawProps,
          "marginHorizontal",
          sourceValue.margin(YGEdgeHorizontal),
          yogaStyle.margin(YGEdgeHorizontal)));

  yogaStyle.setMargin(
      YGEdgeVertical,
      convertRawProp(
          context,
          rawProps,
          "marginVertical",
          sourceValue.margin(YGEdgeVertical),
          yogaStyle.margin(YGEdgeVertical)));

  yogaStyle.setMargin(
      YGEdgeAll,
      convertRawProp(
          context,
          rawProps,
          "margin",
          sourceValue.margin(YGEdgeAll),
          yogaStyle.margin(YGEdgeAll)));

  yogaStyle.setPosition(
      YGEdgeLeft,
      convertRawProp(
          context,
          rawProps,
          "left",
          sourceValue.position(YGEdgeLeft),
          yogaStyle.position(YGEdgeLeft)));

  yogaStyle.setPosition(
      YGEdgeTop,
      convertRawProp(
          context,
          rawProps,
          "top",
          sourceValue.position(YGEdgeTop),
          yogaStyle.position(YGEdgeTop)));

  yogaStyle.setPosition(
      YGEdgeRight,
      convertRawProp(
          context,
          rawProps,
          "right",
          sourceValue.position(YGEdgeRight),
          yogaStyle.position(YGEdgeRight)));

  yogaStyle.setPosition(
      YGEdgeBottom,
      convertRawProp(
          context,
          rawProps,
          "bottom",
          sourceValue.position(YGEdgeBottom),
          yogaStyle.position(YGEdgeBottom)));

  yogaStyle.setPosition(
      YGEdgeStart,
      convertRawProp(
          context,
          rawProps,
          "start",
          sourceValue.position(YGEdgeStart),
          yogaStyle.position(YGEdgeStart)));

  yogaStyle.setPosition(
      YGEdgeEnd,
      convertRawProp(
          context,
          rawProps,
          "end",
          sourceValue.position(YGEdgeEnd),
          yogaStyle.position(YGEdgeEnd)));

  yogaStyle.setPosition(
      YGEdgeHorizontal,
      convertRawProp(
          context,
          rawProps,
          "insetInline",
          sourceValue.position(YGEdgeHorizontal),
          yogaStyle.position(YGEdgeHorizontal)));

  yogaStyle.setPosition(
      YGEdgeVertical,
      convertRawProp(
          context,
          rawProps,
          "insetBlock",
          sourceValue.position(YGEdgeVertical),
          yogaStyle.position(YGEdgeVertical)));

  yogaStyle.setPosition(
      YGEdgeAll,
      convertRawProp(
          context,
          rawProps,
          "inset",
          sourceValue.position(YGEdgeAll),
          yogaStyle.position(YGEdgeAll)));

  yogaStyle.setPadding(
      YGEdgeLeft,
      convertRawProp(
          context,
          rawProps,
          "paddingLeft",
          sourceValue.padding(YGEdgeLeft),
          yogaStyle.padding(YGEdgeLeft)));

  yogaStyle.setPadding(
      YGEdgeTop,
      convertRawProp(
          context,
          rawProps,
          "paddingTop",
          sourceValue.padding(YGEdgeTop),
          yogaStyle.padding(YGEdgeTop)));

  yogaStyle.setPadding(
      YGEdgeRight,
      convertRawProp(
          context,
          rawProps,
          "paddingRight",
          sourceValue.padding(YGEdgeRight),
          yogaStyle.padding(YGEdgeRight)));

  yogaStyle.setPadding(
      YGEdgeBottom,
      convertRawProp(
          context,
          rawProps,
          "paddingBottom",
          sourceValue.padding(YGEdgeBottom),
          yogaStyle.padding(YGEdgeBottom)));

  yogaStyle.setPadding(
      YGEdgeStart,
      convertRawProp(
          context,
          rawProps,
          "paddingStart",
          sourceValue.padding(YGEdgeStart),
          yogaStyle.padding(YGEdgeStart)));

  yogaStyle.setPadding(
      YGEdgeEnd,
      convertRawProp(
          context,
          rawProps,
          "paddingEnd",
          sourceValue.padding(YGEdgeEnd),
          yogaStyle.padding(YGEdgeEnd)));

  yogaStyle.setPadding(
      YGEdgeHorizontal,
      convertRawProp(
          context,
          rawProps,
          "paddingHorizontal",
          sourceValue.padding(YGEdgeHorizontal),
          yogaStyle.padding(YGEdgeHorizontal)));

  yogaStyle.setPadding(
      YGEdgeVertical,
      convertRawProp(
          context,
          rawProps,
          "paddingVertical",
          sourceValue.padding(YGEdgeVertical),
          yogaStyle.padding(YGEdgeVertical)));

  yogaStyle.setPadding(
      YGEdgeAll,
      convertRawProp(
          context,
          rawProps,
          "padding",
          sourceValue.padding(YGEdgeAll),
          yogaStyle.padding(YGEdgeAll)));

  yogaStyle.setGap(
      yoga::Gutter::Row,
      convertRawProp(
          context,
          rawProps,
          "rowGap",
          sourceValue.gap(yoga::Gutter::Row),
          yogaStyle.gap(yoga::Gutter::Row)));

  yogaStyle.setGap(
      yoga::Gutter::Column,
      convertRawProp(
          context,
          rawProps,
          "columnGap",
          sourceValue.gap(yoga::Gutter::Column),
          yogaStyle.gap(yoga::Gutter::Column)));

  yogaStyle.setGap(
      yoga::Gutter::All,
      convertRawProp(
          context,
          rawProps,
          "gap",
          sourceValue.gap(yoga::Gutter::All),
          yogaStyle.gap(yoga::Gutter::All)));

  yogaStyle.setBorder(
      YGEdgeLeft,
      convertRawProp(
          context,
          rawProps,
          "borderLeftWidth",
          sourceValue.border(YGEdgeLeft),
          yogaStyle.border(YGEdgeLeft)));

  yogaStyle.setBorder(
      YGEdgeTop,
      convertRawProp(
          context,
          rawProps,
          "borderTopWidth",
          sourceValue.border(YGEdgeTop),
          yogaStyle.border(YGEdgeTop)));

  yogaStyle.setBorder(
      YGEdgeRight,
      convertRawProp(
          context,
          rawProps,
          "borderRightWidth",
          sourceValue.border(YGEdgeRight),
          yogaStyle.border(YGEdgeRight)));

  yogaStyle.setBorder(
      YGEdgeBottom,
      convertRawProp(
          context,
          rawProps,
          "borderBottomWidth",
          sourceValue.border(YGEdgeBottom),
          yogaStyle.border(YGEdgeBottom)));

  yogaStyle.setBorder(
      YGEdgeStart,
      convertRawProp(
          context,
          rawProps,
          "borderStartWidth",
          sourceValue.border(YGEdgeStart),
          yogaStyle.border(YGEdgeStart)));

  yogaStyle.setBorder(
      YGEdgeEnd,
      convertRawProp(
          context,
          rawProps,
          "borderEndWidth",
          sourceValue.border(YGEdgeEnd),
          yogaStyle.border(YGEdgeEnd)));

  yogaStyle.setBorder(
      YGEdgeHorizontal,
      convertRawProp(
          context,
          rawProps,
          "borderHorizontalWidth",
          sourceValue.border(YGEdgeHorizontal),
          yogaStyle.border(YGEdgeHorizontal)));

  yogaStyle.setBorder(
      YGEdgeVertical,
      convertRawProp(
          context,
          rawProps,
          "borderVerticalWidth",
          sourceValue.border(YGEdgeVertical),
          yogaStyle.border(YGEdgeVertical)));

  yogaStyle.setBorder(
      YGEdgeAll,
      convertRawProp(
          context,
          rawProps,
          "borderWidth",
          sourceValue.border(YGEdgeAll),
          yogaStyle.border(YGEdgeAll)));

  yogaStyle.setDimension(
      yoga::Dimension::Width,
      convertRawProp(
          context,
          rawProps,
          "width",
          sourceValue.dimension(yoga::Dimension::Width),
          {}));
  yogaStyle.setDimension(
      yoga::Dimension::Height,
      convertRawProp(
          context,
          rawProps,
          "height",
          sourceValue.dimension(yoga::Dimension::Height),
          {}));

  yogaStyle.setMinDimension(
      yoga::Dimension::Width,
      convertRawProp(
          context,
          rawProps,
          "minWidth",
          sourceValue.minDimension(yoga::Dimension::Width),
          {}));
  yogaStyle.setMinDimension(
      yoga::Dimension::Height,
      convertRawProp(
          context,
          rawProps,
          "minHeight",
          sourceValue.minDimension(yoga::Dimension::Height),
          {}));

  yogaStyle.setMaxDimension(
      yoga::Dimension::Width,
      convertRawProp(
          context,
          rawProps,
          "maxWidth",
          sourceValue.maxDimension(yoga::Dimension::Width),
          {}));
  yogaStyle.setMaxDimension(
      yoga::Dimension::Height,
      convertRawProp(
          context,
          rawProps,
          "maxHeight",
          sourceValue.maxDimension(yoga::Dimension::Height),
          {}));

  yogaStyle.aspectRatio() = convertRawProp(
      context,
      rawProps,
      "aspectRatio",
      sourceValue.aspectRatio(),
      yogaStyle.aspectRatio());

  return yogaStyle;
}

// This can be deleted when non-iterator ViewProp parsing is deleted
template <typename T>
static inline CascadedRectangleCorners<T> convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const char* prefix,
    const char* suffix,
    const CascadedRectangleCorners<T>& sourceValue,
    const CascadedRectangleCorners<T>& defaultValue) {
  CascadedRectangleCorners<T> result;

  result.topLeft = convertRawProp(
      context,
      rawProps,
      "TopLeft",
      sourceValue.topLeft,
      defaultValue.topLeft,
      prefix,
      suffix);
  result.topRight = convertRawProp(
      context,
      rawProps,
      "TopRight",
      sourceValue.topRight,
      defaultValue.topRight,
      prefix,
      suffix);
  result.bottomLeft = convertRawProp(
      context,
      rawProps,
      "BottomLeft",
      sourceValue.bottomLeft,
      defaultValue.bottomLeft,
      prefix,
      suffix);
  result.bottomRight = convertRawProp(
      context,
      rawProps,
      "BottomRight",
      sourceValue.bottomRight,
      defaultValue.bottomRight,
      prefix,
      suffix);

  result.topStart = convertRawProp(
      context,
      rawProps,
      "TopStart",
      sourceValue.topStart,
      defaultValue.topStart,
      prefix,
      suffix);
  result.topEnd = convertRawProp(
      context,
      rawProps,
      "TopEnd",
      sourceValue.topEnd,
      defaultValue.topEnd,
      prefix,
      suffix);
  result.bottomStart = convertRawProp(
      context,
      rawProps,
      "BottomStart",
      sourceValue.bottomStart,
      defaultValue.bottomStart,
      prefix,
      suffix);
  result.bottomEnd = convertRawProp(
      context,
      rawProps,
      "BottomEnd",
      sourceValue.bottomEnd,
      defaultValue.bottomEnd,
      prefix,
      suffix);
  result.endEnd = convertRawProp(
      context,
      rawProps,
      "EndEnd",
      sourceValue.endEnd,
      defaultValue.endEnd,
      prefix,
      suffix);
  result.endStart = convertRawProp(
      context,
      rawProps,
      "EndStart",
      sourceValue.endStart,
      defaultValue.endStart,
      prefix,
      suffix);
  result.startEnd = convertRawProp(
      context,
      rawProps,
      "StartEnd",
      sourceValue.startEnd,
      defaultValue.startEnd,
      prefix,
      suffix);
  result.startStart = convertRawProp(
      context,
      rawProps,
      "StartStart",
      sourceValue.startStart,
      defaultValue.startStart,
      prefix,
      suffix);

  result.all = convertRawProp(
      context, rawProps, "", sourceValue.all, defaultValue.all, prefix, suffix);

  return result;
}

template <typename T>
static inline CascadedRectangleEdges<T> convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const char* prefix,
    const char* suffix,
    const CascadedRectangleEdges<T>& sourceValue,
    const CascadedRectangleEdges<T>& defaultValue) {
  CascadedRectangleEdges<T> result;

  result.left = convertRawProp(
      context,
      rawProps,
      "Left",
      sourceValue.left,
      defaultValue.left,
      prefix,
      suffix);
  result.right = convertRawProp(
      context,
      rawProps,
      "Right",
      sourceValue.right,
      defaultValue.right,
      prefix,
      suffix);
  result.top = convertRawProp(
      context,
      rawProps,
      "Top",
      sourceValue.top,
      defaultValue.top,
      prefix,
      suffix);
  result.bottom = convertRawProp(
      context,
      rawProps,
      "Bottom",
      sourceValue.bottom,
      defaultValue.bottom,
      prefix,
      suffix);

  result.start = convertRawProp(
      context,
      rawProps,
      "Start",
      sourceValue.start,
      defaultValue.start,
      prefix,
      suffix);
  result.end = convertRawProp(
      context,
      rawProps,
      "End",
      sourceValue.end,
      defaultValue.end,
      prefix,
      suffix);
  result.horizontal = convertRawProp(
      context,
      rawProps,
      "Horizontal",
      sourceValue.horizontal,
      defaultValue.horizontal,
      prefix,
      suffix);
  result.vertical = convertRawProp(
      context,
      rawProps,
      "Vertical",
      sourceValue.vertical,
      defaultValue.vertical,
      prefix,
      suffix);
  result.block = convertRawProp(
      context,
      rawProps,
      "Block",
      sourceValue.block,
      defaultValue.block,
      prefix,
      suffix);
  result.blockEnd = convertRawProp(
      context,
      rawProps,
      "BlockEnd",
      sourceValue.blockEnd,
      defaultValue.blockEnd,
      prefix,
      suffix);
  result.blockStart = convertRawProp(
      context,
      rawProps,
      "BlockStart",
      sourceValue.blockStart,
      defaultValue.blockStart,
      prefix,
      suffix);

  result.all = convertRawProp(
      context, rawProps, "", sourceValue.all, defaultValue.all, prefix, suffix);

  return result;
}

// This can be deleted when non-iterator ViewProp parsing is deleted
static inline ViewEvents convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const ViewEvents& sourceValue,
    const ViewEvents& defaultValue) {
  ViewEvents result{};
  using Offset = ViewEvents::Offset;

  result[Offset::PointerEnter] = convertRawProp(
      context,
      rawProps,
      "onPointerEnter",
      sourceValue[Offset::PointerEnter],
      defaultValue[Offset::PointerEnter]);
  result[Offset::PointerMove] = convertRawProp(
      context,
      rawProps,
      "onPointerMove",
      sourceValue[Offset::PointerMove],
      defaultValue[Offset::PointerMove]);
  result[Offset::PointerLeave] = convertRawProp(
      context,
      rawProps,
      "onPointerLeave",
      sourceValue[Offset::PointerLeave],
      defaultValue[Offset::PointerLeave]);

  // Experimental W3C Pointer callbacks
  result[Offset::PointerEnterCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerEnterCapture",
      sourceValue[Offset::PointerEnterCapture],
      defaultValue[Offset::PointerEnterCapture]);
  result[Offset::PointerMoveCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerMoveCapture",
      sourceValue[Offset::PointerMoveCapture],
      defaultValue[Offset::PointerMoveCapture]);
  result[Offset::PointerLeaveCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerLeaveCapture",
      sourceValue[Offset::PointerLeaveCapture],
      defaultValue[Offset::PointerLeaveCapture]);
  result[Offset::PointerOver] = convertRawProp(
      context,
      rawProps,
      "onPointerOver",
      sourceValue[Offset::PointerOver],
      defaultValue[Offset::PointerOver]);
  result[Offset::PointerOut] = convertRawProp(
      context,
      rawProps,
      "onPointerOut",
      sourceValue[Offset::PointerOut],
      defaultValue[Offset::PointerOut]);
  result[Offset::Click] = convertRawProp(
      context,
      rawProps,
      "onClick",
      sourceValue[Offset::Click],
      defaultValue[Offset::Click]);
  result[Offset::ClickCapture] = convertRawProp(
      context,
      rawProps,
      "onClickCapture",
      sourceValue[Offset::ClickCapture],
      defaultValue[Offset::ClickCapture]);
  result[Offset::PointerDown] = convertRawProp(
      context,
      rawProps,
      "onPointerDown",
      sourceValue[Offset::PointerDown],
      defaultValue[Offset::PointerDown]);
  result[Offset::PointerDownCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerDownCapture",
      sourceValue[Offset::PointerDownCapture],
      defaultValue[Offset::PointerDownCapture]);
  result[Offset::PointerUp] = convertRawProp(
      context,
      rawProps,
      "onPointerUp",
      sourceValue[Offset::PointerUp],
      defaultValue[Offset::PointerUp]);
  result[Offset::PointerUpCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerUpCapture",
      sourceValue[Offset::PointerUpCapture],
      defaultValue[Offset::PointerUpCapture]);
  // TODO: gotPointerCapture & lostPointerCapture

  // PanResponder callbacks
  result[Offset::MoveShouldSetResponder] = convertRawProp(
      context,
      rawProps,
      "onMoveShouldSetResponder",
      sourceValue[Offset::MoveShouldSetResponder],
      defaultValue[Offset::MoveShouldSetResponder]);
  result[Offset::MoveShouldSetResponderCapture] = convertRawProp(
      context,
      rawProps,
      "onMoveShouldSetResponderCapture",
      sourceValue[Offset::MoveShouldSetResponderCapture],
      defaultValue[Offset::MoveShouldSetResponderCapture]);
  result[Offset::StartShouldSetResponder] = convertRawProp(
      context,
      rawProps,
      "onStartShouldSetResponder",
      sourceValue[Offset::StartShouldSetResponder],
      defaultValue[Offset::StartShouldSetResponder]);
  result[Offset::StartShouldSetResponderCapture] = convertRawProp(
      context,
      rawProps,
      "onStartShouldSetResponderCapture",
      sourceValue[Offset::StartShouldSetResponderCapture],
      defaultValue[Offset::StartShouldSetResponderCapture]);
  result[Offset::ResponderGrant] = convertRawProp(
      context,
      rawProps,
      "onResponderGrant",
      sourceValue[Offset::ResponderGrant],
      defaultValue[Offset::ResponderGrant]);
  result[Offset::ResponderReject] = convertRawProp(
      context,
      rawProps,
      "onResponderReject",
      sourceValue[Offset::ResponderReject],
      defaultValue[Offset::ResponderReject]);
  result[Offset::ResponderStart] = convertRawProp(
      context,
      rawProps,
      "onResponderStart",
      sourceValue[Offset::ResponderStart],
      defaultValue[Offset::ResponderStart]);
  result[Offset::ResponderEnd] = convertRawProp(
      context,
      rawProps,
      "onResponderEnd",
      sourceValue[Offset::ResponderEnd],
      defaultValue[Offset::ResponderEnd]);
  result[Offset::ResponderRelease] = convertRawProp(
      context,
      rawProps,
      "onResponderRelease",
      sourceValue[Offset::ResponderRelease],
      defaultValue[Offset::ResponderRelease]);
  result[Offset::ResponderMove] = convertRawProp(
      context,
      rawProps,
      "onResponderMove",
      sourceValue[Offset::ResponderMove],
      defaultValue[Offset::ResponderMove]);
  result[Offset::ResponderTerminate] = convertRawProp(
      context,
      rawProps,
      "onResponderTerminate",
      sourceValue[Offset::ResponderTerminate],
      defaultValue[Offset::ResponderTerminate]);
  result[Offset::ResponderTerminationRequest] = convertRawProp(
      context,
      rawProps,
      "onResponderTerminationRequest",
      sourceValue[Offset::ResponderTerminationRequest],
      defaultValue[Offset::ResponderTerminationRequest]);
  result[Offset::ShouldBlockNativeResponder] = convertRawProp(
      context,
      rawProps,
      "onShouldBlockNativeResponder",
      sourceValue[Offset::ShouldBlockNativeResponder],
      defaultValue[Offset::ShouldBlockNativeResponder]);

  // Touch events
  result[Offset::TouchStart] = convertRawProp(
      context,
      rawProps,
      "onTouchStart",
      sourceValue[Offset::TouchStart],
      defaultValue[Offset::TouchStart]);
  result[Offset::TouchMove] = convertRawProp(
      context,
      rawProps,
      "onTouchMove",
      sourceValue[Offset::TouchMove],
      defaultValue[Offset::TouchMove]);
  result[Offset::TouchEnd] = convertRawProp(
      context,
      rawProps,
      "onTouchEnd",
      sourceValue[Offset::TouchEnd],
      defaultValue[Offset::TouchEnd]);
  result[Offset::TouchCancel] = convertRawProp(
      context,
      rawProps,
      "onTouchCancel",
      sourceValue[Offset::TouchCancel],
      defaultValue[Offset::TouchCancel]);

  return result;
}

} // namespace facebook::react
