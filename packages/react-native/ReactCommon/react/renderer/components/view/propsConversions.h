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

namespace facebook {
namespace react {

// Nearly this entire file can be deleted when iterator-style Prop parsing
// ships fully for View
static inline YGStyle::Dimensions convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *widthName,
    char const *heightName,
    YGStyle::Dimensions const &sourceValue,
    YGStyle::Dimensions const &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[YGDimensionWidth] = convertRawProp(
      context,
      rawProps,
      widthName,
      sourceValue[YGDimensionWidth],
      defaultValue[YGDimensionWidth]);
  dimensions[YGDimensionHeight] = convertRawProp(
      context,
      rawProps,
      heightName,
      sourceValue[YGDimensionHeight],
      defaultValue[YGDimensionHeight]);
  return dimensions;
}

static inline YGStyle::Edges convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    YGStyle::Edges const &sourceValue,
    YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(
      context,
      rawProps,
      "Left",
      sourceValue[YGEdgeLeft],
      defaultValue[YGEdgeLeft],
      prefix,
      suffix);
  result[YGEdgeTop] = convertRawProp(
      context,
      rawProps,
      "Top",
      sourceValue[YGEdgeTop],
      defaultValue[YGEdgeTop],
      prefix,
      suffix);
  result[YGEdgeRight] = convertRawProp(
      context,
      rawProps,
      "Right",
      sourceValue[YGEdgeRight],
      defaultValue[YGEdgeRight],
      prefix,
      suffix);
  result[YGEdgeBottom] = convertRawProp(
      context,
      rawProps,
      "Bottom",
      sourceValue[YGEdgeBottom],
      defaultValue[YGEdgeBottom],
      prefix,
      suffix);
  result[YGEdgeStart] = convertRawProp(
      context,
      rawProps,
      "Start",
      sourceValue[YGEdgeStart],
      defaultValue[YGEdgeStart],
      prefix,
      suffix);
  result[YGEdgeEnd] = convertRawProp(
      context,
      rawProps,
      "End",
      sourceValue[YGEdgeEnd],
      defaultValue[YGEdgeEnd],
      prefix,
      suffix);
  result[YGEdgeHorizontal] = convertRawProp(
      context,
      rawProps,
      "Horizontal",
      sourceValue[YGEdgeHorizontal],
      defaultValue[YGEdgeHorizontal],
      prefix,
      suffix);
  result[YGEdgeVertical] = convertRawProp(
      context,
      rawProps,
      "Vertical",
      sourceValue[YGEdgeVertical],
      defaultValue[YGEdgeVertical],
      prefix,
      suffix);
  result[YGEdgeAll] = convertRawProp(
      context,
      rawProps,
      "",
      sourceValue[YGEdgeAll],
      defaultValue[YGEdgeAll],
      prefix,
      suffix);
  return result;
}

static inline YGStyle::Edges convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    YGStyle::Edges const &sourceValue,
    YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[YGEdgeLeft] = convertRawProp(
      context,
      rawProps,
      "left",
      sourceValue[YGEdgeLeft],
      defaultValue[YGEdgeLeft]);
  result[YGEdgeTop] = convertRawProp(
      context,
      rawProps,
      "top",
      sourceValue[YGEdgeTop],
      defaultValue[YGEdgeTop]);
  result[YGEdgeRight] = convertRawProp(
      context,
      rawProps,
      "right",
      sourceValue[YGEdgeRight],
      defaultValue[YGEdgeRight]);
  result[YGEdgeBottom] = convertRawProp(
      context,
      rawProps,
      "bottom",
      sourceValue[YGEdgeBottom],
      defaultValue[YGEdgeBottom]);
  result[YGEdgeStart] = convertRawProp(
      context,
      rawProps,
      "start",
      sourceValue[YGEdgeStart],
      defaultValue[YGEdgeStart]);
  result[YGEdgeEnd] = convertRawProp(
      context,
      rawProps,
      "end",
      sourceValue[YGEdgeEnd],
      defaultValue[YGEdgeEnd]);
  return result;
}

static inline YGStyle convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    YGStyle const &sourceValue) {
  auto yogaStyle = YGStyle{};
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
  yogaStyle.margin() = convertRawProp(
      context,
      rawProps,
      "margin",
      "",
      sourceValue.margin(),
      yogaStyle.margin());
  yogaStyle.position() = convertRawProp(
      context, rawProps, sourceValue.position(), yogaStyle.position());
  yogaStyle.padding() = convertRawProp(
      context,
      rawProps,
      "padding",
      "",
      sourceValue.padding(),
      yogaStyle.padding());

  yogaStyle.gap()[YGGutterRow] = convertRawProp(
      context,
      rawProps,
      "rowGap",
      sourceValue.gap()[YGGutterRow],
      yogaStyle.gap()[YGGutterRow]);

  yogaStyle.gap()[YGGutterColumn] = convertRawProp(
      context,
      rawProps,
      "columnGap",
      sourceValue.gap()[YGGutterColumn],
      yogaStyle.gap()[YGGutterColumn]);

  yogaStyle.gap()[YGGutterAll] = convertRawProp(
      context,
      rawProps,
      "gap",
      sourceValue.gap()[YGGutterAll],
      yogaStyle.gap()[YGGutterAll]);

  yogaStyle.border() = convertRawProp(
      context,
      rawProps,
      "border",
      "Width",
      sourceValue.border(),
      yogaStyle.border());
  yogaStyle.dimensions() = convertRawProp(
      context,
      rawProps,
      "width",
      "height",
      sourceValue.dimensions(),
      yogaStyle.dimensions());
  yogaStyle.minDimensions() = convertRawProp(
      context,
      rawProps,
      "minWidth",
      "minHeight",
      sourceValue.minDimensions(),
      yogaStyle.minDimensions());
  yogaStyle.maxDimensions() = convertRawProp(
      context,
      rawProps,
      "maxWidth",
      "maxHeight",
      sourceValue.maxDimensions(),
      yogaStyle.maxDimensions());
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
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleCorners<T> const &sourceValue,
    CascadedRectangleCorners<T> const &defaultValue) {
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
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleEdges<T> const &sourceValue,
    CascadedRectangleEdges<T> const &defaultValue) {
  CascadedRectangleEdges<T> result;

  result.leftEdge = convertRawProp(
      context,
      rawProps,
      "Left",
      sourceValue.leftEdge,
      defaultValue.leftEdge,
      prefix,
      suffix);
  result.rightEdge = convertRawProp(
      context,
      rawProps,
      "Right",
      sourceValue.rightEdge,
      defaultValue.rightEdge,
      prefix,
      suffix);
  result.topEdge = convertRawProp(
      context,
      rawProps,
      "Top",
      sourceValue.topEdge,
      defaultValue.topEdge,
      prefix,
      suffix);
  result.bottomEdge = convertRawProp(
      context,
      rawProps,
      "Bottom",
      sourceValue.bottomEdge,
      defaultValue.bottomEdge,
      prefix,
      suffix);

  result.startEdge = convertRawProp(
      context,
      rawProps,
      "Start",
      sourceValue.startEdge,
      defaultValue.startEdge,
      prefix,
      suffix);
  result.endEdge = convertRawProp(
      context,
      rawProps,
      "End",
      sourceValue.endEdge,
      defaultValue.endEdge,
      prefix,
      suffix);
  result.horizontalEdges = convertRawProp(
      context,
      rawProps,
      "Horizontal",
      sourceValue.horizontalEdges,
      defaultValue.horizontalEdges,
      prefix,
      suffix);
  result.verticalEdges = convertRawProp(
      context,
      rawProps,
      "Vertical",
      sourceValue.verticalEdges,
      defaultValue.verticalEdges,
      prefix,
      suffix);
  result.blockEdges = convertRawProp(
      context,
      rawProps,
      "Block",
      sourceValue.blockEdges,
      defaultValue.blockEdges,
      prefix,
      suffix);
  result.blockEndEdge = convertRawProp(
      context,
      rawProps,
      "BlockEnd",
      sourceValue.blockEndEdge,
      defaultValue.blockEndEdge,
      prefix,
      suffix);
  result.blockStartEdge = convertRawProp(
      context,
      rawProps,
      "BlockStart",
      sourceValue.blockStartEdge,
      defaultValue.blockStartEdge,
      prefix,
      suffix);
  result.inlineEdges = convertRawProp(
      context,
      rawProps,
      "Inline",
      sourceValue.inlineEdges,
      defaultValue.inlineEdges,
      prefix,
      suffix);
  result.inlineEndEdge = convertRawProp(
      context,
      rawProps,
      "InlineEnd",
      sourceValue.inlineEndEdge,
      defaultValue.inlineEndEdge,
      prefix,
      suffix);
  result.inlineStartEdge = convertRawProp(
      context,
      rawProps,
      "InlineStart",
      sourceValue.inlineStartEdge,
      defaultValue.inlineStartEdge,
      prefix,
      suffix);

  result.allEdges = convertRawProp(
      context,
      rawProps,
      "",
      sourceValue.allEdges,
      defaultValue.allEdges,
      prefix,
      suffix);

  return result;
}

// This can be deleted when non-iterator ViewProp parsing is deleted
static inline ViewEvents convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    ViewEvents const &sourceValue,
    ViewEvents const &defaultValue) {
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

#ifdef ANDROID

static inline void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    NativeDrawable &result) {
  auto map = (butter::map<std::string, RawValue>)rawValue;

  auto typeIterator = map.find("type");
  react_native_expect(
      typeIterator != map.end() && typeIterator->second.hasType<std::string>());
  std::string type = (std::string)typeIterator->second;

  if (type == "ThemeAttrAndroid") {
    auto attrIterator = map.find("attribute");
    react_native_expect(
        attrIterator != map.end() &&
        attrIterator->second.hasType<std::string>());

    result = NativeDrawable{
        (std::string)attrIterator->second,
        {},
        NativeDrawable::Kind::ThemeAttr,
    };
  } else if (type == "RippleAndroid") {
    auto color = map.find("color");
    auto borderless = map.find("borderless");
    auto rippleRadius = map.find("rippleRadius");

    result = NativeDrawable{
        std::string{},
        NativeDrawable::Ripple{
            color != map.end() && color->second.hasType<int32_t>()
                ? (int32_t)color->second
                : std::optional<int32_t>{},
            rippleRadius != map.end() && rippleRadius->second.hasType<Float>()
                ? (Float)rippleRadius->second
                : std::optional<Float>{},
            borderless != map.end() && borderless->second.hasType<bool>()
                ? (bool)borderless->second
                : false,
        },
        NativeDrawable::Kind::Ripple,
    };
  } else {
    LOG(ERROR) << "Unknown native drawable type: " << type;
    react_native_expect(false);
  }
}

#endif

} // namespace react
} // namespace facebook
