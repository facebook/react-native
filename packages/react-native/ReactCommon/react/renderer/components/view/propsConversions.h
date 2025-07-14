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

namespace facebook::react {

// Nearly this entire file can be deleted when iterator-style Prop parsing
// ships fully for View

static inline yoga::Style convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const yoga::Style& sourceValue) {
  yoga::Style yogaStyle{};

  yogaStyle.setDirection(convertRawProp(
      context,
      rawProps,
      "direction",
      sourceValue.direction(),
      yogaStyle.direction()));

  yogaStyle.setFlexDirection(convertRawProp(
      context,
      rawProps,
      "flexDirection",
      sourceValue.flexDirection(),
      yogaStyle.flexDirection()));

  yogaStyle.setJustifyContent(convertRawProp(
      context,
      rawProps,
      "justifyContent",
      sourceValue.justifyContent(),
      yogaStyle.justifyContent()));

  yogaStyle.setAlignContent(convertRawProp(
      context,
      rawProps,
      "alignContent",
      sourceValue.alignContent(),
      yogaStyle.alignContent()));

  yogaStyle.setAlignItems(convertRawProp(
      context,
      rawProps,
      "alignItems",
      sourceValue.alignItems(),
      yogaStyle.alignItems()));

  yogaStyle.setAlignSelf(convertRawProp(
      context,
      rawProps,
      "alignSelf",
      sourceValue.alignSelf(),
      yogaStyle.alignSelf()));

  yogaStyle.setPositionType(convertRawProp(
      context,
      rawProps,
      "position",
      sourceValue.positionType(),
      yogaStyle.positionType()));

  yogaStyle.setFlexWrap(convertRawProp(
      context,
      rawProps,
      "flexWrap",
      sourceValue.flexWrap(),
      yogaStyle.flexWrap()));

  yogaStyle.setOverflow(convertRawProp(
      context,
      rawProps,
      "overflow",
      sourceValue.overflow(),
      yogaStyle.overflow()));

  yogaStyle.setDisplay(convertRawProp(
      context,
      rawProps,
      "display",
      sourceValue.display(),
      yogaStyle.display()));

  yogaStyle.setFlex(convertRawProp(
      context, rawProps, "flex", sourceValue.flex(), yogaStyle.flex()));

  yogaStyle.setFlexGrow(convertRawProp(
      context,
      rawProps,
      "flexGrow",
      sourceValue.flexGrow(),
      yogaStyle.flexGrow()));

  yogaStyle.setFlexShrink(convertRawProp(
      context,
      rawProps,
      "flexShrink",
      sourceValue.flexShrink(),
      yogaStyle.flexShrink()));

  yogaStyle.setFlexBasis(convertRawProp(
      context,
      rawProps,
      "flexBasis",
      sourceValue.flexBasis(),
      yogaStyle.flexBasis()));

  yogaStyle.setMargin(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "marginLeft",
          sourceValue.margin(yoga::Edge::Left),
          yogaStyle.margin(yoga::Edge::Left)));

  yogaStyle.setMargin(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "marginTop",
          sourceValue.margin(yoga::Edge::Top),
          yogaStyle.margin(yoga::Edge::Top)));

  yogaStyle.setMargin(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "marginRight",
          sourceValue.margin(yoga::Edge::Right),
          yogaStyle.margin(yoga::Edge::Right)));

  yogaStyle.setMargin(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "marginBottom",
          sourceValue.margin(yoga::Edge::Bottom),
          yogaStyle.margin(yoga::Edge::Bottom)));

  yogaStyle.setMargin(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "marginStart",
          sourceValue.margin(yoga::Edge::Start),
          yogaStyle.margin(yoga::Edge::Start)));

  yogaStyle.setMargin(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "marginEnd",
          sourceValue.margin(yoga::Edge::End),
          yogaStyle.margin(yoga::Edge::End)));

  yogaStyle.setMargin(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "marginHorizontal",
          sourceValue.margin(yoga::Edge::Horizontal),
          yogaStyle.margin(yoga::Edge::Horizontal)));

  yogaStyle.setMargin(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "marginVertical",
          sourceValue.margin(yoga::Edge::Vertical),
          yogaStyle.margin(yoga::Edge::Vertical)));

  yogaStyle.setMargin(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "margin",
          sourceValue.margin(yoga::Edge::All),
          yogaStyle.margin(yoga::Edge::All)));

  yogaStyle.setPosition(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "left",
          sourceValue.position(yoga::Edge::Left),
          yogaStyle.position(yoga::Edge::Left)));

  yogaStyle.setPosition(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "top",
          sourceValue.position(yoga::Edge::Top),
          yogaStyle.position(yoga::Edge::Top)));

  yogaStyle.setPosition(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "right",
          sourceValue.position(yoga::Edge::Right),
          yogaStyle.position(yoga::Edge::Right)));

  yogaStyle.setPosition(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "bottom",
          sourceValue.position(yoga::Edge::Bottom),
          yogaStyle.position(yoga::Edge::Bottom)));

  yogaStyle.setPosition(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "start",
          sourceValue.position(yoga::Edge::Start),
          yogaStyle.position(yoga::Edge::Start)));

  yogaStyle.setPosition(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "end",
          sourceValue.position(yoga::Edge::End),
          yogaStyle.position(yoga::Edge::End)));

  yogaStyle.setPosition(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "insetInline",
          sourceValue.position(yoga::Edge::Horizontal),
          yogaStyle.position(yoga::Edge::Horizontal)));

  yogaStyle.setPosition(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "insetBlock",
          sourceValue.position(yoga::Edge::Vertical),
          yogaStyle.position(yoga::Edge::Vertical)));

  yogaStyle.setPosition(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "inset",
          sourceValue.position(yoga::Edge::All),
          yogaStyle.position(yoga::Edge::All)));

  yogaStyle.setPadding(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "paddingLeft",
          sourceValue.padding(yoga::Edge::Left),
          yogaStyle.padding(yoga::Edge::Left)));

  yogaStyle.setPadding(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "paddingTop",
          sourceValue.padding(yoga::Edge::Top),
          yogaStyle.padding(yoga::Edge::Top)));

  yogaStyle.setPadding(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "paddingRight",
          sourceValue.padding(yoga::Edge::Right),
          yogaStyle.padding(yoga::Edge::Right)));

  yogaStyle.setPadding(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "paddingBottom",
          sourceValue.padding(yoga::Edge::Bottom),
          yogaStyle.padding(yoga::Edge::Bottom)));

  yogaStyle.setPadding(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "paddingStart",
          sourceValue.padding(yoga::Edge::Start),
          yogaStyle.padding(yoga::Edge::Start)));

  yogaStyle.setPadding(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "paddingEnd",
          sourceValue.padding(yoga::Edge::End),
          yogaStyle.padding(yoga::Edge::End)));

  yogaStyle.setPadding(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "paddingHorizontal",
          sourceValue.padding(yoga::Edge::Horizontal),
          yogaStyle.padding(yoga::Edge::Horizontal)));

  yogaStyle.setPadding(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "paddingVertical",
          sourceValue.padding(yoga::Edge::Vertical),
          yogaStyle.padding(yoga::Edge::Vertical)));

  yogaStyle.setPadding(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "padding",
          sourceValue.padding(yoga::Edge::All),
          yogaStyle.padding(yoga::Edge::All)));

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
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "borderLeftWidth",
          sourceValue.border(yoga::Edge::Left),
          yogaStyle.border(yoga::Edge::Left)));

  yogaStyle.setBorder(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "borderTopWidth",
          sourceValue.border(yoga::Edge::Top),
          yogaStyle.border(yoga::Edge::Top)));

  yogaStyle.setBorder(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "borderRightWidth",
          sourceValue.border(yoga::Edge::Right),
          yogaStyle.border(yoga::Edge::Right)));

  yogaStyle.setBorder(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "borderBottomWidth",
          sourceValue.border(yoga::Edge::Bottom),
          yogaStyle.border(yoga::Edge::Bottom)));

  yogaStyle.setBorder(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "borderStartWidth",
          sourceValue.border(yoga::Edge::Start),
          yogaStyle.border(yoga::Edge::Start)));

  yogaStyle.setBorder(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "borderEndWidth",
          sourceValue.border(yoga::Edge::End),
          yogaStyle.border(yoga::Edge::End)));

  yogaStyle.setBorder(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "borderHorizontalWidth",
          sourceValue.border(yoga::Edge::Horizontal),
          yogaStyle.border(yoga::Edge::Horizontal)));

  yogaStyle.setBorder(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "borderVerticalWidth",
          sourceValue.border(yoga::Edge::Vertical),
          yogaStyle.border(yoga::Edge::Vertical)));

  yogaStyle.setBorder(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "borderWidth",
          sourceValue.border(yoga::Edge::All),
          yogaStyle.border(yoga::Edge::All)));

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

  yogaStyle.setAspectRatio(convertRawProp(
      context,
      rawProps,
      "aspectRatio",
      sourceValue.aspectRatio(),
      yogaStyle.aspectRatio()));

  yogaStyle.setBoxSizing(convertRawProp(
      context,
      rawProps,
      "boxSizing",
      sourceValue.boxSizing(),
      yogaStyle.boxSizing()));

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
  result[Offset::PointerOverCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerOverCapture",
      sourceValue[Offset::PointerOverCapture],
      defaultValue[Offset::PointerOverCapture]);
  result[Offset::PointerOut] = convertRawProp(
      context,
      rawProps,
      "onPointerOut",
      sourceValue[Offset::PointerOut],
      defaultValue[Offset::PointerOut]);
  result[Offset::PointerOutCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerOutCapture",
      sourceValue[Offset::PointerOutCapture],
      defaultValue[Offset::PointerOutCapture]);
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
