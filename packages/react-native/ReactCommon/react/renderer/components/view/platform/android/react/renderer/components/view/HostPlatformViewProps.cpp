/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostPlatformViewProps.h"

#include <algorithm>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/TransformUtils.h>

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
                    {})),
      screenReaderFocusable(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.screenReaderFocusable
              : convertRawProp(
                    context,
                    rawProps,
                    "screenReaderFocusable",
                    sourceProps.screenReaderFocusable,
                    {})),
      nextFocusDown(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.nextFocusDown
              : convertRawProp(
                    context,
                    rawProps,
                    "nextFocusDown",
                    sourceProps.nextFocusDown,
                    {})),
      nextFocusForward(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.nextFocusForward
              : convertRawProp(
                    context,
                    rawProps,
                    "nextFocusForward",
                    sourceProps.nextFocusForward,
                    {})),
      nextFocusLeft(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.nextFocusLeft
              : convertRawProp(
                    context,
                    rawProps,
                    "nextFocusLeft",
                    sourceProps.nextFocusLeft,
                    {})),
      nextFocusRight(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.nextFocusRight
              : convertRawProp(
                    context,
                    rawProps,
                    "nextFocusRight",
                    sourceProps.nextFocusRight,
                    {})),
      nextFocusUp(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.nextFocusUp
              : convertRawProp(
                    context,
                    rawProps,
                    "nextFocusUp",
                    sourceProps.nextFocusUp,
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
    RAW_SET_PROP_SWITCH_CASE_BASIC(screenReaderFocusable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusDown);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusForward);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusLeft);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusRight);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusUp);
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

#ifdef RN_SERIALIZABLE_STATE

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

static void updateBorderWidthPropValue(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<float>& newValue,
    const std::optional<float>& oldValue) {
  if (newValue != oldValue) {
    if (newValue.has_value()) {
      result[propName] = newValue.value();
    } else {
      result[propName] = NULL;
    }
  }
}

static void updateBorderWidthProps(
    folly::dynamic& result,
    const CascadedBorderWidths& newBorderWidths,
    const CascadedBorderWidths& oldBorderWidths) {
  updateBorderWidthPropValue(
      result, "borderWidth", newBorderWidths.all, oldBorderWidths.all);
  updateBorderWidthPropValue(
      result, "borderTopWidth", newBorderWidths.top, oldBorderWidths.top);
  updateBorderWidthPropValue(
      result, "borderLeftWidth", newBorderWidths.left, oldBorderWidths.left);
  updateBorderWidthPropValue(
      result, "borderStartWidth", newBorderWidths.start, oldBorderWidths.start);
  updateBorderWidthPropValue(
      result, "borderEndWidth", newBorderWidths.end, oldBorderWidths.end);
  updateBorderWidthPropValue(
      result, "borderRightWidth", newBorderWidths.right, oldBorderWidths.right);
  updateBorderWidthPropValue(
      result,
      "borderBottomWidth",
      newBorderWidths.bottom,
      oldBorderWidths.bottom);
}

static void updateBorderRadiusPropValue(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<ValueUnit>& newValue,
    const std::optional<ValueUnit>& oldValue) {
  if (newValue != oldValue) {
    if (newValue.has_value()) {
      if (newValue.value().unit == UnitType::Percent) {
        result[propName] = std::to_string(newValue.value().value) + "%";
      } else {
        result[propName] = newValue.value().value;
      }
    } else {
      result[propName] = -1;
    }
  }
}

static void updateBorderRadiusProps(
    folly::dynamic& result,
    const CascadedBorderRadii& newBorderRadii,
    const CascadedBorderRadii& oldBorderRadii) {
  updateBorderRadiusPropValue(
      result, "borderRadius", newBorderRadii.all, oldBorderRadii.all);
  updateBorderRadiusPropValue(
      result,
      "borderTopLeftRadius",
      newBorderRadii.topLeft,
      oldBorderRadii.topLeft);
  updateBorderRadiusPropValue(
      result,
      "borderTopRightRadius",
      newBorderRadii.topRight,
      oldBorderRadii.topRight);
  updateBorderRadiusPropValue(
      result,
      "borderBottomRightRadius",
      newBorderRadii.bottomRight,
      oldBorderRadii.bottomRight);
  updateBorderRadiusPropValue(
      result,
      "borderBottomLeftRadius",
      newBorderRadii.bottomLeft,
      oldBorderRadii.bottomLeft);
  updateBorderRadiusPropValue(
      result,
      "borderTopStartRadius",
      newBorderRadii.topStart,
      oldBorderRadii.topStart);
  updateBorderRadiusPropValue(
      result,
      "borderTopEndRadius",
      newBorderRadii.topEnd,
      oldBorderRadii.topEnd);
  updateBorderRadiusPropValue(
      result,
      "borderBottomStartRadius",
      newBorderRadii.bottomStart,
      oldBorderRadii.bottomStart);
  updateBorderRadiusPropValue(
      result,
      "borderBottomEndRadius",
      newBorderRadii.bottomEnd,
      oldBorderRadii.bottomEnd);
  updateBorderRadiusPropValue(
      result,
      "borderEndEndRadius",
      newBorderRadii.endEnd,
      oldBorderRadii.endEnd);
  updateBorderRadiusPropValue(
      result,
      "borderEndStartRadius",
      newBorderRadii.endStart,
      oldBorderRadii.endStart);
  updateBorderRadiusPropValue(
      result,
      "borderStartEndRadius",
      newBorderRadii.startEnd,
      oldBorderRadii.startEnd);
  updateBorderRadiusPropValue(
      result,
      "borderStartStartRadius",
      newBorderRadii.startStart,
      oldBorderRadii.startStart);
}

static void updateBorderStyleProps(
    folly::dynamic& result,
    const CascadedBorderStyles& newBorderStyle,
    const CascadedBorderStyles& oldBorderStyle) {
  if (newBorderStyle.all != oldBorderStyle.all) {
    if (newBorderStyle.all.has_value()) {
      switch (newBorderStyle.all.value()) {
        case BorderStyle::Solid:
          result["borderStyle"] = "solid";
          break;
        case BorderStyle::Dotted:
          result["borderStyle"] = "dotted";
          break;
        case BorderStyle::Dashed:
          result["borderStyle"] = "dashed";
          break;
      }
    } else {
      result["borderStyle"] = folly::dynamic(nullptr);
    }
  }
}

static void updateBorderColorPropValue(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<SharedColor>& newColor,
    const std::optional<SharedColor>& oldColor) {
  if (newColor != oldColor) {
    result[propName] = newColor.has_value() ? *newColor.value() : NULL;
  }
}

static void updateBorderColorsProps(
    folly::dynamic& result,
    const CascadedBorderColors& newBorderColor,
    const CascadedBorderColors& oldBorderColor) {
  updateBorderColorPropValue(
      result, "borderColor", newBorderColor.all, oldBorderColor.all);
  updateBorderColorPropValue(
      result, "borderLeftColor", newBorderColor.left, oldBorderColor.left);
  updateBorderColorPropValue(
      result, "borderRightColor", newBorderColor.right, oldBorderColor.right);
  updateBorderColorPropValue(
      result, "borderTopColor", newBorderColor.top, oldBorderColor.top);
  updateBorderColorPropValue(
      result,
      "borderBottomColor",
      newBorderColor.bottom,
      oldBorderColor.bottom);
  updateBorderColorPropValue(
      result, "borderEndColor", newBorderColor.end, oldBorderColor.end);
  updateBorderColorPropValue(
      result, "borderStartColor", newBorderColor.start, oldBorderColor.start);
  updateBorderColorPropValue(
      result, "borderBlockColor", newBorderColor.block, oldBorderColor.block);
  updateBorderColorPropValue(
      result,
      "borderBlockEndColor",
      newBorderColor.blockEnd,
      oldBorderColor.blockEnd);
  updateBorderColorPropValue(
      result,
      "borderBlockStartColor",
      newBorderColor.blockStart,
      oldBorderColor.blockStart);
}

inline static void updateNativeDrawableProp(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<NativeDrawable>& nativeDrawable) {
  folly::dynamic nativeDrawableResult;
  if (nativeDrawable.has_value()) {
    nativeDrawableResult = folly::dynamic::object();
    const auto& nativeDrawableValue = nativeDrawable.value();
    nativeDrawableResult["attribute"] = nativeDrawableValue.themeAttr;
    switch (nativeDrawableValue.kind) {
      case NativeDrawable::Kind::Ripple:
        nativeDrawableResult["type"] = "RippleAndroid";
        break;
      case NativeDrawable::Kind::ThemeAttr:
        nativeDrawableResult["type"] = "ThemeAttrAndroid";
        break;
    }
    if (nativeDrawableValue.ripple.rippleRadius.has_value()) {
      nativeDrawableResult["rippleRadius"] =
          nativeDrawableValue.ripple.rippleRadius.value();
    }
    if (nativeDrawableValue.ripple.color.has_value() ||
        nativeDrawableValue.ripple.colorResourcePaths.has_value()) {
      if (nativeDrawableValue.ripple.colorResourcePaths.has_value()) {
        folly::dynamic resourcePaths = folly::dynamic::array();
        for (const auto& path :
             nativeDrawableValue.ripple.colorResourcePaths.value()) {
          resourcePaths.push_back(path);
        }
        folly::dynamic platformColorMap = folly::dynamic::object();
        platformColorMap["resource_paths"] = resourcePaths;
        nativeDrawableResult["color"] = platformColorMap;
      } else {
        nativeDrawableResult["color"] =
            toAndroidRepr(nativeDrawableValue.ripple.color.value());
      }
      if (nativeDrawableValue.ripple.alpha.has_value()) {
        nativeDrawableResult["alpha"] =
            nativeDrawableValue.ripple.alpha.value();
      }
    }
    nativeDrawableResult["borderless"] = nativeDrawableValue.ripple.borderless;
  } else {
    nativeDrawableResult = folly::dynamic(nullptr);
  }

  result[propName] = nativeDrawableResult;
}

inline static void updateAccessibilityStateProp(
    folly::dynamic& result,
    const std::optional<AccessibilityState>& newState,
    const std::optional<AccessibilityState>& oldState) {
  folly::dynamic resultState = folly::dynamic::object();

  if (!newState.has_value() && oldState.has_value()) {
    result["accessibilityState"] = resultState;
    return;
  }

  if (!oldState.has_value() || newState->disabled != oldState->disabled) {
    resultState["disabled"] = newState->disabled;
  }

  if (!oldState.has_value() || newState->selected != oldState->selected) {
    resultState["selected"] = newState->selected;
  }

  if (!oldState.has_value() || newState->busy != oldState->busy) {
    resultState["busy"] = newState->busy;
  }

  if (!oldState.has_value() || newState->expanded != oldState->expanded) {
    if (newState->expanded.has_value()) {
      resultState["expanded"] = newState->expanded.value();
    }
  }

  if (!oldState.has_value() || newState->checked != oldState->checked) {
    switch (newState->checked) {
      case AccessibilityState::Unchecked:
        resultState["checked"] = false;
        break;
      case AccessibilityState::Checked:
        resultState["checked"] = true;
        break;
      case AccessibilityState::Mixed:
        resultState["checked"] = "mixed";
        break;
      case AccessibilityState::None:
        resultState["checked"] = "none";
        break;
    }
  }
  result["accessibilityState"] = resultState;
}

ComponentName HostPlatformViewProps::getDiffPropsImplementationTarget() const {
  return "View";
}

// Behavior-preserving helpers extracted from getDiffProps below to keep its
// cyclomatic complexity low. Each mirrors one of the recurring
// compare-and-assign shapes used per prop, so the serialized output (keys,
// values, conversions, and insertion order) is identical to the open-coded
// version.
template <typename T>
static void appendIfChanged(
    folly::dynamic& result,
    const char* propName,
    const T& newValue,
    const T& oldValue) {
  if (newValue != oldValue) {
    result[propName] = newValue;
  }
}

template <typename T>
static void appendDerefIfChanged(
    folly::dynamic& result,
    const char* propName,
    const T& newValue,
    const T& oldValue) {
  if (newValue != oldValue) {
    result[propName] = *newValue;
  }
}

template <typename T, typename Convert>
static void appendConvertedIfChanged(
    folly::dynamic& result,
    const char* propName,
    const T& newValue,
    const T& oldValue,
    Convert&& convert) {
  if (newValue != oldValue) {
    result[propName] = convert(newValue);
  }
}

template <typename T, typename Convert>
static void appendOptionalIfChanged(
    folly::dynamic& result,
    const char* propName,
    const std::optional<T>& newValue,
    const std::optional<T>& oldValue,
    Convert&& convert) {
  if (newValue != oldValue) {
    result[propName] = newValue.has_value()
        ? folly::dynamic(convert(newValue.value()))
        : folly::dynamic(nullptr);
  }
}

static void appendOutlineStyleIfChanged(
    folly::dynamic& result,
    OutlineStyle outlineStyle,
    OutlineStyle oldOutlineStyle) {
  if (outlineStyle != oldOutlineStyle) {
    switch (outlineStyle) {
      case OutlineStyle::Solid:
        result["outlineStyle"] = "solid";
        break;
      case OutlineStyle::Dotted:
        result["outlineStyle"] = "dotted";
        break;
      case OutlineStyle::Dashed:
        result["outlineStyle"] = "dashed";
        break;
    }
  }
}

static void appendBackfaceVisibilityIfChanged(
    folly::dynamic& result,
    BackfaceVisibility backfaceVisibility,
    BackfaceVisibility oldBackfaceVisibility) {
  if (backfaceVisibility != oldBackfaceVisibility) {
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
}

static void appendOverflowIfChanged(
    folly::dynamic& result,
    bool clipsContentToBounds,
    bool oldClipsContentToBounds) {
  if (clipsContentToBounds != oldClipsContentToBounds) {
    result["overflow"] = clipsContentToBounds ? "hidden" : "visible";
    result["scroll"] = result["overflow"];
  }
}

template <typename T>
static void appendNativeDrawableIfChanged(
    folly::dynamic& result,
    const char* propName,
    const T& newValue,
    const T& oldValue) {
  if (newValue != oldValue) {
    updateNativeDrawableProp(result, propName, newValue);
  }
}

template <typename T>
static void
appendEventProps(folly::dynamic& result, const T& events, const T& oldEvents) {
  if (events != oldEvents) {
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerEnter,
        "onPointerEnter");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerEnterCapture,
        "onPointerEnterCapture");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerMove,
        "onPointerMove");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerMoveCapture,
        "onPointerMoveCapture");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerLeave,
        "onPointerLeave");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerLeaveCapture,
        "onPointerLeaveCapture");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerOver,
        "onPointerOver");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerOverCapture,
        "onPointerOverCapture");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerOut,
        "onPointerOut");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::PointerOutCapture,
        "onPointerOutCapture");
    updateEventProp(
        result, events, oldEvents, ViewEvents::Offset::Click, "onClick");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ClickCapture,
        "onClickCapture");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::MoveShouldSetResponder,
        "onMoveShouldSetResponder");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::MoveShouldSetResponderCapture,
        "onMoveShouldSetResponderCapture");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::StartShouldSetResponder,
        "onStartShouldSetResponder");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::StartShouldSetResponderCapture,
        "onStartShouldSetResponderCapture");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderGrant,
        "onResponderGrant");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderReject,
        "onResponderReject");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderStart,
        "onResponderStart");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderEnd,
        "onResponderEnd");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderRelease,
        "onResponderRelease");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderMove,
        "onResponderMove");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderTerminate,
        "onResponderTerminate");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ResponderTerminationRequest,
        "onResponderTerminationRequest");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::ShouldBlockNativeResponder,
        "onShouldBlockNativeResponder");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::TouchStart,
        "onTouchStart");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::TouchMove,
        "onTouchMove");
    updateEventProp(
        result, events, oldEvents, ViewEvents::Offset::TouchEnd, "onTouchEnd");
    updateEventProp(
        result,
        events,
        oldEvents,
        ViewEvents::Offset::TouchCancel,
        "onTouchCancel");
  }
}

template <typename TTransform, typename TOrigin>
static void appendTransformIfChanged(
    folly::dynamic& result,
    const TTransform& transform,
    const TTransform& oldTransform,
    const TOrigin& transformOrigin,
    const TOrigin& oldTransformOrigin) {
  if (transform != oldTransform || transformOrigin != oldTransformOrigin) {
    folly::dynamic resultTranslateArray = folly::dynamic::array();
    for (const auto& operation : transform.operations) {
      updateTransformProps(transform, operation, resultTranslateArray);
    }
    result["transform"] = std::move(resultTranslateArray);
  }
}

template <typename T>
static void appendAccessibilityStateIfChanged(
    folly::dynamic& result,
    const T& accessibilityState,
    const T& oldAccessibilityState) {
  if (accessibilityState != oldAccessibilityState) {
    updateAccessibilityStateProp(
        result, accessibilityState, oldAccessibilityState);
  }
}

template <typename T>
static void appendAccessibilityLabelledByIfChanged(
    folly::dynamic& result,
    const T& accessibilityLabelledBy,
    const T& oldAccessibilityLabelledBy) {
  if (accessibilityLabelledBy != oldAccessibilityLabelledBy) {
    auto accessibilityLabelledByValues = folly::dynamic::array();
    for (const auto& accessibilityLabelledByValue :
         accessibilityLabelledBy.value) {
      accessibilityLabelledByValues.push_back(accessibilityLabelledByValue);
    }
    result["accessibilityLabelledBy"] = accessibilityLabelledByValues;
  }
}

template <typename T>
static void appendAccessibilityOrderIfChanged(
    folly::dynamic& result,
    const T& accessibilityOrder,
    const T& oldAccessibilityOrder) {
  if (accessibilityOrder != oldAccessibilityOrder) {
    auto accessibilityChildrenIds = folly::dynamic::array();
    for (const auto& accessibilityChildId : accessibilityOrder) {
      accessibilityChildrenIds.push_back(accessibilityChildId);
    }
    result["experimental_accessibilityOrder"] = accessibilityChildrenIds;
  }
}

template <typename T>
static void appendAccessibilityValueIfChanged(
    folly::dynamic& result,
    const T& accessibilityValue,
    const T& oldAccessibilityValue) {
  if (accessibilityValue != oldAccessibilityValue) {
    folly::dynamic accessibilityValueObject = folly::dynamic::object();
    if (accessibilityValue.min.has_value()) {
      accessibilityValueObject["min"] = accessibilityValue.min.value();
    }
    if (accessibilityValue.max.has_value()) {
      accessibilityValueObject["max"] = accessibilityValue.max.value();
    }
    if (accessibilityValue.now.has_value()) {
      accessibilityValueObject["now"] = accessibilityValue.now.value();
    }
    if (accessibilityValue.text.has_value()) {
      accessibilityValueObject["text"] = accessibilityValue.text.value();
    }
    result["accessibilityValue"] = accessibilityValueObject;
  }
}

template <typename T>
static void appendAccessibilityActionsIfChanged(
    folly::dynamic& result,
    const T& accessibilityActions,
    const T& oldAccessibilityActions) {
  if (accessibilityActions != oldAccessibilityActions) {
    auto accessibilityActionsArray = folly::dynamic::array();
    for (const auto& accessibilityAction : accessibilityActions) {
      folly::dynamic accessibilityActionObject = folly::dynamic::object();
      accessibilityActionObject["name"] = accessibilityAction.name;
      if (accessibilityAction.label.has_value()) {
        accessibilityActionObject["label"] = accessibilityAction.label.value();
      }
      accessibilityActionsArray.push_back(accessibilityActionObject);
    }
    result["accessibilityActions"] = accessibilityActionsArray;
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

  auto asString = [](const auto& value) { return toString(value); };
  auto asDynamic = [](const auto& value) { return toDynamic(value); };
  auto asIs = [](const auto& value) { return value; };

  appendIfChanged(result, "elevation", elevation, oldProps->elevation);
  appendIfChanged(result, "focusable", focusable, oldProps->focusable);
  appendIfChanged(
      result,
      "hasTVPreferredFocus",
      hasTVPreferredFocus,
      oldProps->hasTVPreferredFocus);
  appendIfChanged(
      result,
      "needsOffscreenAlphaCompositing",
      needsOffscreenAlphaCompositing,
      oldProps->needsOffscreenAlphaCompositing);
  appendIfChanged(
      result,
      "renderToHardwareTextureAndroid",
      renderToHardwareTextureAndroid,
      oldProps->renderToHardwareTextureAndroid);
  appendIfChanged(
      result,
      "screenReaderFocusable",
      screenReaderFocusable,
      oldProps->screenReaderFocusable);
  appendConvertedIfChanged(result, "role", role, oldProps->role, asString);
  appendIfChanged(result, "opacity", opacity, oldProps->opacity);
  appendDerefIfChanged(
      result, "backgroundColor", backgroundColor, oldProps->backgroundColor);
  appendDerefIfChanged(
      result, "outlineColor", outlineColor, oldProps->outlineColor);
  appendIfChanged(
      result, "outlineOffset", outlineOffset, oldProps->outlineOffset);
  appendOutlineStyleIfChanged(result, outlineStyle, oldProps->outlineStyle);
  appendIfChanged(result, "outlineWidth", outlineWidth, oldProps->outlineWidth);
  appendDerefIfChanged(
      result, "shadowColor", shadowColor, oldProps->shadowColor);
  appendIfChanged(
      result, "shadowOpacity", shadowOpacity, oldProps->shadowOpacity);
  appendIfChanged(result, "shadowRadius", shadowRadius, oldProps->shadowRadius);
  appendIfChanged(
      result, "shouldRasterize", shouldRasterize, oldProps->shouldRasterize);
  appendIfChanged(result, "collapsable", collapsable, oldProps->collapsable);
  appendIfChanged(
      result,
      "removeClippedSubviews",
      removeClippedSubviews,
      oldProps->removeClippedSubviews);
  appendIfChanged(
      result,
      "collapsableChildren",
      collapsableChildren,
      oldProps->collapsableChildren);
  appendIfChanged(result, "onLayout", onLayout, oldProps->onLayout);
  appendOptionalIfChanged(result, "zIndex", zIndex, oldProps->zIndex, asIs);
  appendConvertedIfChanged(
      result, "boxShadow", boxShadow, oldProps->boxShadow, asDynamic);
  appendConvertedIfChanged(
      result, "filter", filter, oldProps->filter, asDynamic);
  appendConvertedIfChanged(
      result,
      "experimental_backgroundImage",
      backgroundImage,
      oldProps->backgroundImage,
      asDynamic);
  appendConvertedIfChanged(
      result, "mixBlendMode", mixBlendMode, oldProps->mixBlendMode, asString);
  appendConvertedIfChanged(
      result,
      "pointerEvents",
      pointerEvents,
      oldProps->pointerEvents,
      asString);
  appendConvertedIfChanged(
      result, "hitSlop", hitSlop, oldProps->hitSlop, asDynamic);
  appendIfChanged(result, "nativeID", nativeId, oldProps->nativeId);
  appendIfChanged(result, "testID", testId, oldProps->testId);
  appendIfChanged(result, "accessible", accessible, oldProps->accessible);
  appendOverflowIfChanged(
      result, getClipsContentToBounds(), oldProps->getClipsContentToBounds());
  appendBackfaceVisibilityIfChanged(
      result, backfaceVisibility, oldProps->backfaceVisibility);
  appendNativeDrawableIfChanged(
      result,
      "nativeBackgroundAndroid",
      nativeBackground,
      oldProps->nativeBackground);
  appendNativeDrawableIfChanged(
      result,
      "nativeForegroundAndroid",
      nativeForeground,
      oldProps->nativeForeground);

  // Events
  // TODO T212662692: pass events as std::bitset<64> to java
  appendEventProps(result, events, oldProps->events);

  // Borders
  auto borderWidths = getBorderWidths();
  auto oldBorderWidths = oldProps->getBorderWidths();
  if (borderWidths != oldBorderWidths) {
    updateBorderWidthProps(result, borderWidths, oldBorderWidths);
  }

  if (borderStyles != oldProps->borderStyles) {
    updateBorderStyleProps(result, borderStyles, oldProps->borderStyles);
  }

  if (borderColors != oldProps->borderColors) {
    updateBorderColorsProps(result, borderColors, oldProps->borderColors);
  }

  if (borderRadii != oldProps->borderRadii) {
    updateBorderRadiusProps(result, borderRadii, oldProps->borderRadii);
  }

  // Transforms
  appendTransformIfChanged(
      result,
      transform,
      oldProps->transform,
      transformOrigin,
      oldProps->transformOrigin);
  appendIfChanged(
      result, "transformOrigin", transformOrigin, oldProps->transformOrigin);

  // Accessibility

  appendAccessibilityStateIfChanged(
      result, accessibilityState, oldProps->accessibilityState);
  appendIfChanged(
      result,
      "accessibilityLabel",
      accessibilityLabel,
      oldProps->accessibilityLabel);
  appendAccessibilityLabelledByIfChanged(
      result, accessibilityLabelledBy, oldProps->accessibilityLabelledBy);
  appendAccessibilityOrderIfChanged(
      result, accessibilityOrder, oldProps->accessibilityOrder);
  appendConvertedIfChanged(
      result,
      "accessibilityLiveRegion",
      accessibilityLiveRegion,
      oldProps->accessibilityLiveRegion,
      asString);
  appendIfChanged(
      result,
      "accessibilityHint",
      accessibilityHint,
      oldProps->accessibilityHint);
  appendIfChanged(
      result,
      "accessibilityRole",
      accessibilityRole,
      oldProps->accessibilityRole);
  appendIfChanged(
      result,
      "accessibilityLanguage",
      accessibilityLanguage,
      oldProps->accessibilityLanguage);
  appendAccessibilityValueIfChanged(
      result, accessibilityValue, oldProps->accessibilityValue);
  appendAccessibilityActionsIfChanged(
      result, accessibilityActions, oldProps->accessibilityActions);
  appendIfChanged(
      result,
      "accessibilityViewIsModal",
      accessibilityViewIsModal,
      oldProps->accessibilityViewIsModal);
  appendIfChanged(
      result,
      "accessibilityElementsHidden",
      accessibilityElementsHidden,
      oldProps->accessibilityElementsHidden);
  appendIfChanged(
      result,
      "accessibilityIgnoresInvertColors",
      accessibilityIgnoresInvertColors,
      oldProps->accessibilityIgnoresInvertColors);
  appendIfChanged(
      result,
      "onAccessibilityTap",
      onAccessibilityTap,
      oldProps->onAccessibilityTap);
  appendIfChanged(
      result,
      "onAccessibilityMagicTap",
      onAccessibilityMagicTap,
      oldProps->onAccessibilityMagicTap);
  appendIfChanged(
      result,
      "onAccessibilityEscape",
      onAccessibilityEscape,
      oldProps->onAccessibilityEscape);
  appendIfChanged(
      result,
      "onAccessibilityAction",
      onAccessibilityAction,
      oldProps->onAccessibilityAction);
  appendConvertedIfChanged(
      result,
      "importantForAccessibility",
      importantForAccessibility,
      oldProps->importantForAccessibility,
      asString);
  appendOptionalIfChanged(
      result, "nextFocusDown", nextFocusDown, oldProps->nextFocusDown, asIs);
  appendOptionalIfChanged(
      result,
      "nextFocusForward",
      nextFocusForward,
      oldProps->nextFocusForward,
      asIs);
  appendOptionalIfChanged(
      result, "nextFocusLeft", nextFocusLeft, oldProps->nextFocusLeft, asIs);
  appendOptionalIfChanged(
      result, "nextFocusRight", nextFocusRight, oldProps->nextFocusRight, asIs);
  appendOptionalIfChanged(
      result, "nextFocusUp", nextFocusUp, oldProps->nextFocusUp, asIs);

  return result;
}

#endif

} // namespace facebook::react
