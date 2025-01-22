/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostPlatformViewProps.h"

#include <algorithm>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

HostPlatformViewProps::HostPlatformViewProps(
    const PropsParserContext& context,
    const HostPlatformViewProps& sourceProps,
    const RawProps& rawProps,
    const std::function<bool(const std::string&)>& filterObjectKeys)
    : BaseViewProps(context, sourceProps, rawProps, filterObjectKeys),
      elevation(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.elevation
              : convertRawProp(
                    context,
                    rawProps,
                    "elevation",
                    sourceProps.elevation,
                    {})),
      nativeBackground(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.nativeBackground
              : convertRawProp(
                    context,
                    rawProps,
                    "nativeBackgroundAndroid",
                    sourceProps.nativeBackground,
                    {})),
      nativeForeground(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.nativeForeground
              : convertRawProp(
                    context,
                    rawProps,
                    "nativeForegroundAndroid",
                    sourceProps.nativeForeground,
                    {})),
      focusable(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.focusable
              : convertRawProp(
                    context,
                    rawProps,
                    "focusable",
                    sourceProps.focusable,
                    {})),
      hasTVPreferredFocus(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.hasTVPreferredFocus
              : convertRawProp(
                    context,
                    rawProps,
                    "hasTVPreferredFocus",
                    sourceProps.hasTVPreferredFocus,
                    {})),
      needsOffscreenAlphaCompositing(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.needsOffscreenAlphaCompositing
              : convertRawProp(
                    context,
                    rawProps,
                    "needsOffscreenAlphaCompositing",
                    sourceProps.needsOffscreenAlphaCompositing,
                    {})),
      renderToHardwareTextureAndroid(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.renderToHardwareTextureAndroid
              : convertRawProp(
                    context,
                    rawProps,
                    "renderToHardwareTextureAndroid",
                    sourceProps.renderToHardwareTextureAndroid,
                    {})) {}

#define VIEW_EVENT_CASE(eventType)                      \
  case CONSTEXPR_RAW_PROPS_KEY_HASH("on" #eventType): { \
    const auto offset = ViewEvents::Offset::eventType;  \
    ViewEvents defaultViewEvents{};                     \
    bool res = defaultViewEvents[offset];               \
    if (value.hasValue()) {                             \
      fromRawValue(context, value, res);                \
    }                                                   \
    events[offset] = res;                               \
    return;                                             \
  }

void HostPlatformViewProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  BaseViewProps::setProp(context, hash, propName, value);

  static auto defaults = HostPlatformViewProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(elevation);
    RAW_SET_PROP_SWITCH_CASE(nativeBackground, "nativeBackgroundAndroid");
    RAW_SET_PROP_SWITCH_CASE(nativeForeground, "nativeForegroundAndroid");
    RAW_SET_PROP_SWITCH_CASE_BASIC(focusable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(hasTVPreferredFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(needsOffscreenAlphaCompositing);
    RAW_SET_PROP_SWITCH_CASE_BASIC(renderToHardwareTextureAndroid);
  }
}

bool HostPlatformViewProps::getProbablyMoreHorizontalThanVertical_DEPRECATED()
    const {
  return yogaStyle.flexDirection() == yoga::FlexDirection::Row;
}

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList HostPlatformViewProps::getDebugProps() const {
  return BaseViewProps::getDebugProps();
}
#endif

#ifdef ANDROID

inline static void updateEventProp(
    folly::dynamic& result,
    const ViewEvents& newEvents,
    const ViewEvents& oldEvents,
    const ViewEvents::Offset& offset,
    const std::string& name) {
  if (newEvents[offset] != oldEvents[offset]) {
    auto value = newEvents[offset];
    result[name] = value;
  }
}

folly::dynamic HostPlatformViewProps::getDiffProps(
    const Props* prevProps) const {
  folly::dynamic result = folly::dynamic::object();

  static const auto defaultProps = HostPlatformViewProps();

  const HostPlatformViewProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const HostPlatformViewProps*>(prevProps);

  if (this == oldProps) {
    return result;
  }
  if (focusable != oldProps->focusable) {
    result["focusable"] = focusable;
  }

  if (hasTVPreferredFocus != oldProps->hasTVPreferredFocus) {
    result["hasTVPreferredFocus"] = hasTVPreferredFocus;
  }

  if (needsOffscreenAlphaCompositing !=
      oldProps->needsOffscreenAlphaCompositing) {
    result["needsOffscreenAlphaCompositing"] = needsOffscreenAlphaCompositing;
  }

  if (renderToHardwareTextureAndroid !=
      oldProps->renderToHardwareTextureAndroid) {
    result["renderToHardwareTextureAndroid"] = renderToHardwareTextureAndroid;
  }

  if (opacity != oldProps->opacity) {
    result["opacity"] = opacity;
  }

  if (backgroundColor != oldProps->backgroundColor) {
    result["backgroundColor"] = *backgroundColor;
  }

  if (shadowColor != oldProps->shadowColor) {
    result["shadowColor"] = *shadowColor;
  }

  if (shadowOpacity != oldProps->shadowOpacity) {
    result["shadowOpacity"] = shadowOpacity;
  }

  if (shadowRadius != oldProps->shadowRadius) {
    result["shadowRadius"] = shadowRadius;
  }

  if (shouldRasterize != oldProps->shouldRasterize) {
    result["shouldRasterize"] = shouldRasterize;
  }

  if (collapsable != oldProps->collapsable) {
    result["collapsable"] = collapsable;
  }

  if (removeClippedSubviews != oldProps->removeClippedSubviews) {
    result["removeClippedSubviews"] = removeClippedSubviews;
  }

  if (onLayout != oldProps->onLayout) {
    result["onLayout"] = onLayout;
  }

  if (zIndex != oldProps->zIndex) {
    result["zIndex"] = zIndex.value();
  }

  if (pointerEvents != oldProps->pointerEvents) {
    std::string value;
    switch (pointerEvents) {
      case PointerEventsMode::BoxOnly:
        result["pointerEvents"] = "box-only";
        break;
      case PointerEventsMode::BoxNone:
        result["pointerEvents"] = "box-none";
        break;
      case PointerEventsMode::None:
        result["pointerEvents"] = "none";
        break;
      default:
        result["pointerEvents"] = "auto";
        break;
    }
  }

  if (nativeId != oldProps->nativeId) {
    result["nativeId"] = nativeId;
  }

  if (testId != oldProps->testId) {
    result["testId"] = testId;
  }

  if (accessible != oldProps->accessible) {
    result["accessible"] = accessible;
  }

  if (getClipsContentToBounds() != oldProps->getClipsContentToBounds()) {
    result["overflow"] = getClipsContentToBounds() ? "hidden" : "visible";
    result["scroll"] = result["overflow"];
  }

  if (backfaceVisibility != oldProps->backfaceVisibility) {
    switch (backfaceVisibility) {
      case BackfaceVisibility::Auto:
        result["backfaceVisibility"] = "auto";
        break;
      case BackfaceVisibility::Visible:
        result["backfaceVisibility"] = "visible";
        break;
      case BackfaceVisibility::Hidden:
        result["backfaceVisibility"] = "hidden";
        break;
    }
  }

  // TODO T212662692: pass events as std::bitset<64> to java
  if (events != oldProps->events) {
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerEnter,
        "onPointerEnter");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerEnterCapture,
        "onPointerEnterCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerMove,
        "onPointerMove");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerMoveCapture,
        "onPointerMoveCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerLeave,
        "onPointerLeave");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerLeaveCapture,
        "onPointerLeaveCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerOver,
        "onPointerOver");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerOut,
        "onPointerOut");
    updateEventProp(
        result, events, oldProps->events, ViewEvents::Offset::Click, "onClick");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::MoveShouldSetResponder,
        "onMoveShouldSetResponder");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::MoveShouldSetResponderCapture,
        "onMoveShouldSetResponderCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::StartShouldSetResponder,
        "onStartShouldSetResponder");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::StartShouldSetResponderCapture,
        "onStartShouldSetResponderCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderGrant,
        "onResponderGrant");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderReject,
        "onResponderReject");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderStart,
        "onResponderStart");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderEnd,
        "onResponderEnd");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderRelease,
        "onResponderRelease");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderMove,
        "onResponderMove");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderTerminate,
        "onResponderTerminate");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderTerminationRequest,
        "onResponderTerminationRequest");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ShouldBlockNativeResponder,
        "onShouldBlockNativeResponder");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchStart,
        "onTouchStart");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchMove,
        "onTouchMove");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchEnd,
        "onTouchEnd");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchCancel,
        "onTouchCancel");
  }

  return result;
}

#endif

} // namespace facebook::react
