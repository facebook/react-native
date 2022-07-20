/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewProps.h"

#include <algorithm>

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/renderer/graphics/conversions.h>

namespace facebook {
namespace react {

ViewProps::ViewProps(
    const PropsParserContext &context,
    ViewProps const &sourceProps,
    RawProps const &rawProps,
    bool shouldSetRawProps)
    : YogaStylableProps(context, sourceProps, rawProps, shouldSetRawProps),
      AccessibilityProps(context, sourceProps, rawProps),
      opacity(
          Props::enablePropIteratorSetter ? sourceProps.opacity
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "opacity",
                                                sourceProps.opacity,
                                                (Float)1.0)),
      foregroundColor(
          Props::enablePropIteratorSetter ? sourceProps.foregroundColor
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "foregroundColor",
                                                sourceProps.foregroundColor,
                                                {})),
      backgroundColor(
          Props::enablePropIteratorSetter ? sourceProps.backgroundColor
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "backgroundColor",
                                                sourceProps.backgroundColor,
                                                {})),
      borderRadii(
          Props::enablePropIteratorSetter ? sourceProps.borderRadii
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "border",
                                                "Radius",
                                                sourceProps.borderRadii,
                                                {})),
      borderColors(
          Props::enablePropIteratorSetter ? sourceProps.borderColors
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "border",
                                                "Color",
                                                sourceProps.borderColors,
                                                {})),
      borderStyles(
          Props::enablePropIteratorSetter ? sourceProps.borderStyles
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "border",
                                                "Style",
                                                sourceProps.borderStyles,
                                                {})),
      shadowColor(
          Props::enablePropIteratorSetter ? sourceProps.shadowColor
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowColor",
                                                sourceProps.shadowColor,
                                                {})),
      shadowOffset(
          Props::enablePropIteratorSetter ? sourceProps.shadowOffset
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowOffset",
                                                sourceProps.shadowOffset,
                                                {})),
      shadowOpacity(
          Props::enablePropIteratorSetter ? sourceProps.shadowOpacity
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowOpacity",
                                                sourceProps.shadowOpacity,
                                                {})),
      shadowRadius(
          Props::enablePropIteratorSetter ? sourceProps.shadowRadius
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowRadius",
                                                sourceProps.shadowRadius,
                                                {})),
      transform(
          Props::enablePropIteratorSetter ? sourceProps.transform
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "transform",
                                                sourceProps.transform,
                                                {})),
      backfaceVisibility(
          Props::enablePropIteratorSetter ? sourceProps.backfaceVisibility
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "backfaceVisibility",
                                                sourceProps.backfaceVisibility,
                                                {})),
      shouldRasterize(
          Props::enablePropIteratorSetter ? sourceProps.shouldRasterize
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shouldRasterize",
                                                sourceProps.shouldRasterize,
                                                {})),
      zIndex(
          Props::enablePropIteratorSetter ? sourceProps.zIndex
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "zIndex",
                                                sourceProps.zIndex,
                                                {})),
      pointerEvents(
          Props::enablePropIteratorSetter ? sourceProps.pointerEvents
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "pointerEvents",
                                                sourceProps.pointerEvents,
                                                {})),
      hitSlop(
          Props::enablePropIteratorSetter ? sourceProps.hitSlop
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "hitSlop",
                                                sourceProps.hitSlop,
                                                {})),
      onLayout(
          Props::enablePropIteratorSetter ? sourceProps.onLayout
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "onLayout",
                                                sourceProps.onLayout,
                                                {})),
      events(
          Props::enablePropIteratorSetter
              ? sourceProps.events
              : convertRawProp(context, rawProps, sourceProps.events, {})),
      collapsable(
          Props::enablePropIteratorSetter ? sourceProps.collapsable
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "collapsable",
                                                sourceProps.collapsable,
                                                true)),
      removeClippedSubviews(
          Props::enablePropIteratorSetter
              ? sourceProps.removeClippedSubviews
              : convertRawProp(
                    context,
                    rawProps,
                    "removeClippedSubviews",
                    sourceProps.removeClippedSubviews,
                    false))
#ifdef ANDROID
      ,
      elevation(
          Props::enablePropIteratorSetter ? sourceProps.elevation
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "elevation",
                                                sourceProps.elevation,
                                                {})),
      nativeBackground(
          Props::enablePropIteratorSetter ? sourceProps.nativeBackground
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "nativeBackgroundAndroid",
                                                sourceProps.nativeBackground,
                                                {})),
      nativeForeground(
          Props::enablePropIteratorSetter ? sourceProps.nativeForeground
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "nativeForegroundAndroid",
                                                sourceProps.nativeForeground,
                                                {})),
      focusable(
          Props::enablePropIteratorSetter ? sourceProps.focusable
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "focusable",
                                                sourceProps.focusable,
                                                {})),
      hasTVPreferredFocus(
          Props::enablePropIteratorSetter ? sourceProps.hasTVPreferredFocus
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "hasTVPreferredFocus",
                                                sourceProps.hasTVPreferredFocus,
                                                {})),
      needsOffscreenAlphaCompositing(
          Props::enablePropIteratorSetter
              ? sourceProps.needsOffscreenAlphaCompositing
              : convertRawProp(
                    context,
                    rawProps,
                    "needsOffscreenAlphaCompositing",
                    sourceProps.needsOffscreenAlphaCompositing,
                    {})),
      renderToHardwareTextureAndroid(
          Props::enablePropIteratorSetter
              ? sourceProps.renderToHardwareTextureAndroid
              : convertRawProp(
                    context,
                    rawProps,
                    "renderToHardwareTextureAndroid",
                    sourceProps.renderToHardwareTextureAndroid,
                    {}))

#endif
          {};

#define VIEW_EVENT_CASE(eventType, eventString)     \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(eventString): { \
    ViewEvents defaultViewEvents{};                 \
    events[eventType] = ({                          \
      bool res = defaultViewEvents[eventType];      \
      if (value.hasValue()) {                       \
        fromRawValue(context, value, res);          \
      }                                             \
      res;                                          \
    });                                             \
    return;                                         \
  }

void ViewProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  YogaStylableProps::setProp(context, hash, propName, value);
  AccessibilityProps::setProp(context, hash, propName, value);

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(opacity, (Float)1.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(foregroundColor, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(backgroundColor, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowColor, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowOffset, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowOpacity, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowRadius, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(transform, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(backfaceVisibility, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(shouldRasterize, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(zIndex, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(pointerEvents, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(hitSlop, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(onLayout, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(collapsable, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(removeClippedSubviews, false);
    // events field
    VIEW_EVENT_CASE(ViewEvents::Offset::PointerEnter, "onPointerEnter");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::PointerEnterCapture, "onPointerEnterCapture");
    VIEW_EVENT_CASE(ViewEvents::Offset::PointerMove, "onPointerMove");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::PointerMoveCapture, "onPointerMoveCapture");
    VIEW_EVENT_CASE(ViewEvents::Offset::PointerLeave, "onPointerLeave");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::PointerLeaveCapture, "onPointerLeaveCapture");
    VIEW_EVENT_CASE(ViewEvents::Offset::PointerOver, "onPointerOver");
    VIEW_EVENT_CASE(ViewEvents::Offset::PointerOut, "onPointerOut");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::MoveShouldSetResponder, "onMoveShouldSetResponder");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::MoveShouldSetResponderCapture,
        "onMoveShouldSetResponderCapture");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::StartShouldSetResponder,
        "onStartShouldSetResponder");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::StartShouldSetResponderCapture,
        "onStartShouldSetResponderCapture");
    VIEW_EVENT_CASE(ViewEvents::Offset::ResponderGrant, "onResponderGrant");
    VIEW_EVENT_CASE(ViewEvents::Offset::ResponderReject, "onResponderReject");
    VIEW_EVENT_CASE(ViewEvents::Offset::ResponderStart, "onResponderStart");
    VIEW_EVENT_CASE(ViewEvents::Offset::ResponderEnd, "onResponderEnd");
    VIEW_EVENT_CASE(ViewEvents::Offset::ResponderRelease, "onResponderRelease");
    VIEW_EVENT_CASE(ViewEvents::Offset::ResponderMove, "ResponderMove");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::ResponderTerminate, "onResponderTerminate");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::ResponderTerminationRequest,
        "onResponderTerminationRequest");
    VIEW_EVENT_CASE(
        ViewEvents::Offset::ShouldBlockNativeResponder,
        "onShouldBlockNativeResponder");
    VIEW_EVENT_CASE(ViewEvents::Offset::TouchStart, "onTouchStart");
    VIEW_EVENT_CASE(ViewEvents::Offset::TouchMove, "onTouchMove");
    VIEW_EVENT_CASE(ViewEvents::Offset::TouchEnd, "onTouchEnd");
    VIEW_EVENT_CASE(ViewEvents::Offset::TouchCancel, "onTouchCancel");
#ifdef ANDROID
    RAW_SET_PROP_SWITCH_CASE_BASIC(elevation, {});
    RAW_SET_PROP_SWITCH_CASE(nativeBackground, "nativeBackgroundAndroid", {});
    RAW_SET_PROP_SWITCH_CASE(nativeForeground, "nativeForegroundAndroid", {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(focusable, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(hasTVPreferredFocus, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(needsOffscreenAlphaCompositing, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(renderToHardwareTextureAndroid, false);
#endif
    // BorderRadii
    SET_CASCADED_RECTANGLE_CORNERS(borderRadii, "border", "Radius", value);
    SET_CASCADED_RECTANGLE_EDGES(borderColors, "border", "Color", value);
    SET_CASCADED_RECTANGLE_EDGES(borderStyles, "border", "Style", value);
  }
}

#pragma mark - Convenience Methods

static BorderRadii ensureNoOverlap(BorderRadii const &radii, Size const &size) {
  // "Corner curves must not overlap: When the sum of any two adjacent border
  // radii exceeds the size of the border box, UAs must proportionally reduce
  // the used values of all border radii until none of them overlap."
  // Source: https://www.w3.org/TR/css-backgrounds-3/#corner-overlap

  auto insets = EdgeInsets{
      /* .left = */ radii.topLeft + radii.bottomLeft,
      /* .top = */ radii.topLeft + radii.topRight,
      /* .right = */ radii.topRight + radii.bottomRight,
      /* .bottom = */ radii.bottomLeft + radii.bottomRight,
  };

  auto insetsScale = EdgeInsets{
      /* .left = */
      insets.left > 0 ? std::min((Float)1.0, size.height / insets.left) : 0,
      /* .top = */
      insets.top > 0 ? std::min((Float)1.0, size.width / insets.top) : 0,
      /* .right = */
      insets.right > 0 ? std::min((Float)1.0, size.height / insets.right) : 0,
      /* .bottom = */
      insets.bottom > 0 ? std::min((Float)1.0, size.width / insets.bottom) : 0,
  };

  return BorderRadii{
      /* topLeft = */
      radii.topLeft * std::min(insetsScale.top, insetsScale.left),
      /* topRight = */
      radii.topRight * std::min(insetsScale.top, insetsScale.right),
      /* bottomLeft = */
      radii.bottomLeft * std::min(insetsScale.bottom, insetsScale.left),
      /* bottomRight = */
      radii.bottomRight * std::min(insetsScale.bottom, insetsScale.right),
  };
}

BorderMetrics ViewProps::resolveBorderMetrics(
    LayoutMetrics const &layoutMetrics) const {
  auto isRTL =
      bool{layoutMetrics.layoutDirection == LayoutDirection::RightToLeft};

  auto borderWidths = CascadedBorderWidths{
      /* .left = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeLeft]),
      /* .top = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeTop]),
      /* .right = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeRight]),
      /* .bottom = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeBottom]),
      /* .start = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeStart]),
      /* .end = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeEnd]),
      /* .horizontal = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeHorizontal]),
      /* .vertical = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeVertical]),
      /* .all = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeAll]),
  };

  return {
      /* .borderColors = */ borderColors.resolve(isRTL, {}),
      /* .borderWidths = */ borderWidths.resolve(isRTL, 0),
      /* .borderRadii = */
      ensureNoOverlap(borderRadii.resolve(isRTL, 0), layoutMetrics.frame.size),
      /* .borderStyles = */ borderStyles.resolve(isRTL, BorderStyle::Solid),
  };
}

bool ViewProps::getClipsContentToBounds() const {
  return yogaStyle.overflow() != YGOverflowVisible;
}

#ifdef ANDROID
bool ViewProps::getProbablyMoreHorizontalThanVertical_DEPRECATED() const {
  return yogaStyle.flexDirection() == YGFlexDirectionRow;
}
#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ViewProps::getDebugProps() const {
  const auto &defaultViewProps = ViewProps();

  return AccessibilityProps::getDebugProps() +
      YogaStylableProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "opacity", opacity, defaultViewProps.opacity),
          debugStringConvertibleItem(
              "foregroundColor",
              foregroundColor,
              defaultViewProps.foregroundColor),
          debugStringConvertibleItem(
              "backgroundColor",
              backgroundColor,
              defaultViewProps.backgroundColor),
          debugStringConvertibleItem(
              "zIndex", zIndex, defaultViewProps.zIndex.value_or(0)),
      };
}
#endif

} // namespace react
} // namespace facebook
