/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/graphics/conversions.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

#include <optional>

namespace facebook {
namespace react {

namespace {
// ViewProps values
constexpr MapBuffer::Key VP_ACCESSIBILITY_ACTIONS = 0;
constexpr MapBuffer::Key VP_ACCESSIBILITY_HINT = 1;
constexpr MapBuffer::Key VP_ACCESSIBILITY_LABEL = 2;
constexpr MapBuffer::Key VP_ACCESSIBILITY_LABELLED_BY = 3;
constexpr MapBuffer::Key VP_ACCESSIBILITY_LIVE_REGION = 4;
constexpr MapBuffer::Key VP_ACCESSIBILITY_ROLE = 5;
constexpr MapBuffer::Key VP_ACCESSIBILITY_STATE = 6;
constexpr MapBuffer::Key VP_ACCESSIBILITY_VALUE = 7;
constexpr MapBuffer::Key VP_ACCESSIBLE = 8;
constexpr MapBuffer::Key VP_BACKFACE_VISIBILITY = 9;
constexpr MapBuffer::Key VP_BG_COLOR = 10;
constexpr MapBuffer::Key VP_BORDER_COLOR = 11;
constexpr MapBuffer::Key VP_BORDER_RADII = 12;
constexpr MapBuffer::Key VP_BORDER_STYLE = 13;
constexpr MapBuffer::Key VP_COLLAPSABLE = 14;
constexpr MapBuffer::Key VP_ELEVATION = 15;
constexpr MapBuffer::Key VP_FOCUSABLE = 16;
constexpr MapBuffer::Key VP_HAS_TV_FOCUS = 17;
constexpr MapBuffer::Key VP_HIT_SLOP = 18;
constexpr MapBuffer::Key VP_IMPORTANT_FOR_ACCESSIBILITY = 19;
constexpr MapBuffer::Key VP_NATIVE_BACKGROUND = 20;
constexpr MapBuffer::Key VP_NATIVE_FOREGROUND = 21;
constexpr MapBuffer::Key VP_NATIVE_ID = 22;
constexpr MapBuffer::Key VP_OFFSCREEN_ALPHA_COMPOSITING = 23;
constexpr MapBuffer::Key VP_OPACITY = 24;
constexpr MapBuffer::Key VP_POINTER_EVENTS = 25;
constexpr MapBuffer::Key VP_POINTER_ENTER = 26;
constexpr MapBuffer::Key VP_POINTER_LEAVE = 27;
constexpr MapBuffer::Key VP_POINTER_MOVE = 28;
constexpr MapBuffer::Key VP_REMOVE_CLIPPED_SUBVIEW = 29;
constexpr MapBuffer::Key VP_RENDER_TO_HARDWARE_TEXTURE = 30;
constexpr MapBuffer::Key VP_SHADOW_COLOR = 31;
constexpr MapBuffer::Key VP_TEST_ID = 32;
constexpr MapBuffer::Key VP_TRANSFORM = 33;
constexpr MapBuffer::Key VP_ZINDEX = 34;
constexpr MapBuffer::Key VP_POINTER_ENTER_CAPTURE = 38;
constexpr MapBuffer::Key VP_POINTER_LEAVE_CAPTURE = 39;
constexpr MapBuffer::Key VP_POINTER_MOVE_CAPTURE = 40;

// Yoga values
constexpr MapBuffer::Key YG_BORDER_WIDTH = 100;
constexpr MapBuffer::Key YG_OVERFLOW = 101;

// AccessibilityAction values
constexpr MapBuffer::Key ACCESSIBILITY_ACTION_NAME = 0;
constexpr MapBuffer::Key ACCESSIBILITY_ACTION_LABEL = 1;

static MapBuffer convertAccessibilityActions(
    std::vector<AccessibilityAction> const &actions) {
  MapBufferBuilder builder(actions.size());
  for (auto i = 0; i < actions.size(); i++) {
    auto const &action = actions[i];
    MapBufferBuilder actionsBuilder(2);
    actionsBuilder.putString(ACCESSIBILITY_ACTION_NAME, action.name);
    if (action.label.has_value()) {
      actionsBuilder.putString(
          ACCESSIBILITY_ACTION_LABEL, action.label.value());
    }
    builder.putMapBuffer(i, actionsBuilder.build());
  }
  return builder.build();
}

static MapBuffer convertAccessibilityLabelledBy(
    AccessibilityLabelledBy const &labelledBy) {
  MapBufferBuilder builder(labelledBy.value.size());
  for (auto i = 0; i < labelledBy.value.size(); i++) {
    builder.putString(i, labelledBy.value[i]);
  }
  return builder.build();
}

// AccessibilityState values
constexpr MapBuffer::Key ACCESSIBILITY_STATE_BUSY = 0;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_DISABLED = 1;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_EXPANDED = 2;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_SELECTED = 3;
constexpr MapBuffer::Key ACCESSIBILITY_STATE_CHECKED = 4;

MapBuffer convertAccessibilityState(AccessibilityState const &state) {
  MapBufferBuilder builder(5);
  builder.putBool(ACCESSIBILITY_STATE_BUSY, state.busy);
  builder.putBool(ACCESSIBILITY_STATE_DISABLED, state.disabled);
  builder.putBool(ACCESSIBILITY_STATE_EXPANDED, state.expanded);
  builder.putBool(ACCESSIBILITY_STATE_SELECTED, state.selected);
  int checked;
  switch (state.checked) {
    case AccessibilityState::Unchecked:
      checked = 0;
      break;
    case AccessibilityState::Checked:
      checked = 1;
      break;
    case AccessibilityState::Mixed:
      checked = 2;
      break;
    case AccessibilityState::None:
      checked = 3;
      break;
  }
  builder.putInt(ACCESSIBILITY_STATE_CHECKED, checked);
  return builder.build();
}

inline void putOptionalColor(
    MapBufferBuilder &builder,
    MapBuffer::Key key,
    std::optional<SharedColor> const &color) {
  builder.putInt(key, color.has_value() ? toAndroidRepr(color.value()) : -1);
}

constexpr MapBuffer::Key EDGE_TOP = 0;
constexpr MapBuffer::Key EDGE_LEFT = 1;
constexpr MapBuffer::Key EDGE_RIGHT = 2;
constexpr MapBuffer::Key EDGE_BOTTOM = 3;
constexpr MapBuffer::Key EDGE_START = 4;
constexpr MapBuffer::Key EDGE_END = 5;
constexpr MapBuffer::Key EDGE_ALL = 6;

MapBuffer convertBorderColors(CascadedBorderColors const &colors) {
  MapBufferBuilder builder(7);
  putOptionalColor(builder, EDGE_TOP, colors.top);
  putOptionalColor(builder, EDGE_RIGHT, colors.right);
  putOptionalColor(builder, EDGE_BOTTOM, colors.bottom);
  putOptionalColor(builder, EDGE_LEFT, colors.left);
  putOptionalColor(builder, EDGE_START, colors.start);
  putOptionalColor(builder, EDGE_END, colors.end);
  putOptionalColor(builder, EDGE_ALL, colors.all);
  return builder.build();
}

constexpr MapBuffer::Key CORNER_TOP_LEFT = 0;
constexpr MapBuffer::Key CORNER_TOP_RIGHT = 1;
constexpr MapBuffer::Key CORNER_BOTTOM_RIGHT = 2;
constexpr MapBuffer::Key CORNER_BOTTOM_LEFT = 3;
constexpr MapBuffer::Key CORNER_TOP_START = 4;
constexpr MapBuffer::Key CORNER_TOP_END = 5;
constexpr MapBuffer::Key CORNER_BOTTOM_END = 6;
constexpr MapBuffer::Key CORNER_BOTTOM_START = 7;
constexpr MapBuffer::Key CORNER_ALL = 8;

inline void putOptionalFloat(
    MapBufferBuilder &builder,
    MapBuffer::Key key,
    std::optional<Float> const &value) {
  builder.putDouble(key, value.value_or(NAN));
}

MapBuffer convertBorderRadii(CascadedBorderRadii const &radii) {
  MapBufferBuilder builder(9);
  putOptionalFloat(builder, CORNER_TOP_LEFT, radii.topLeft);
  putOptionalFloat(builder, CORNER_TOP_RIGHT, radii.topRight);
  putOptionalFloat(builder, CORNER_BOTTOM_RIGHT, radii.bottomRight);
  putOptionalFloat(builder, CORNER_BOTTOM_LEFT, radii.bottomLeft);
  putOptionalFloat(builder, CORNER_TOP_START, radii.topStart);
  putOptionalFloat(builder, CORNER_TOP_END, radii.topEnd);
  putOptionalFloat(builder, CORNER_BOTTOM_END, radii.bottomEnd);
  putOptionalFloat(builder, CORNER_BOTTOM_START, radii.bottomStart);
  putOptionalFloat(builder, CORNER_ALL, radii.all);
  return builder.build();
}

MapBuffer convertBorderWidths(YGStyle::Edges const &border) {
  MapBufferBuilder builder(7);
  putOptionalFloat(
      builder, EDGE_TOP, optionalFloatFromYogaValue(border[YGEdgeTop]));
  putOptionalFloat(
      builder, EDGE_RIGHT, optionalFloatFromYogaValue(border[YGEdgeRight]));
  putOptionalFloat(
      builder, EDGE_BOTTOM, optionalFloatFromYogaValue(border[YGEdgeBottom]));
  putOptionalFloat(
      builder, EDGE_LEFT, optionalFloatFromYogaValue(border[YGEdgeLeft]));
  putOptionalFloat(
      builder, EDGE_START, optionalFloatFromYogaValue(border[YGEdgeStart]));
  putOptionalFloat(
      builder, EDGE_END, optionalFloatFromYogaValue(border[YGEdgeEnd]));
  putOptionalFloat(
      builder, EDGE_ALL, optionalFloatFromYogaValue(border[YGEdgeAll]));
  return builder.build();
}

MapBuffer convertEdgeInsets(EdgeInsets const &insets) {
  MapBufferBuilder builder(4);
  builder.putDouble(EDGE_TOP, insets.top);
  builder.putDouble(EDGE_RIGHT, insets.right);
  builder.putDouble(EDGE_BOTTOM, insets.bottom);
  builder.putDouble(EDGE_LEFT, insets.left);
  return builder.build();
}

#ifdef ANDROID

constexpr MapBuffer::Key NATIVE_DRAWABLE_KIND = 0;
constexpr MapBuffer::Key NATIVE_DRAWABLE_ATTRIBUTE = 1;
constexpr MapBuffer::Key NATIVE_DRAWABLE_COLOR = 2;
constexpr MapBuffer::Key NATIVE_DRAWABLE_BORDERLESS = 3;
constexpr MapBuffer::Key NATIVE_DRAWABLE_RIPPLE_RADIUS = 4;

MapBuffer convertNativeBackground(std::optional<NativeDrawable> const &value) {
  if (!value.has_value()) {
    return MapBufferBuilder::EMPTY();
  }

  auto const &drawable = value.value();
  MapBufferBuilder builder(4);
  switch (drawable.kind) {
    case NativeDrawable::Kind::ThemeAttr:
      builder.putInt(NATIVE_DRAWABLE_KIND, 0);
      builder.putString(NATIVE_DRAWABLE_ATTRIBUTE, drawable.themeAttr);
      break;
    case NativeDrawable::Kind::Ripple:
      builder.putInt(NATIVE_DRAWABLE_KIND, 1);
      if (drawable.ripple.color.has_value()) {
        builder.putInt(NATIVE_DRAWABLE_COLOR, drawable.ripple.color.value());
      }

      builder.putBool(NATIVE_DRAWABLE_BORDERLESS, drawable.ripple.borderless);
      if (drawable.ripple.rippleRadius.has_value()) {
        builder.putDouble(
            NATIVE_DRAWABLE_RIPPLE_RADIUS,
            drawable.ripple.rippleRadius.value());
      }
      break;
  }
  return builder.build();
}

#endif

MapBuffer convertTransform(Transform const &transform) {
  MapBufferBuilder builder(16);
  for (int32_t i = 0; i < transform.matrix.size(); i++) {
    builder.putDouble(i, transform.matrix[i]);
  }
  return builder.build();
}
} // namespace

/**
 * Diffs two sets of ViewProps into MapBuffer.
 * TODO: Currently unsupported: nextFocusForward/Left/Up/Right/Down
 */
static inline MapBuffer viewPropsDiff(
    ViewProps const &oldProps,
    ViewProps const &newProps) {
  MapBufferBuilder builder;
  if (oldProps.accessibilityActions != newProps.accessibilityActions) {
    builder.putMapBuffer(
        VP_ACCESSIBILITY_ACTIONS,
        convertAccessibilityActions(newProps.accessibilityActions));
  }

  if (oldProps.accessibilityHint != newProps.accessibilityHint) {
    builder.putString(VP_ACCESSIBILITY_HINT, newProps.accessibilityHint);
  }

  if (oldProps.accessibilityLabel != newProps.accessibilityLabel) {
    builder.putString(VP_ACCESSIBILITY_LABEL, newProps.accessibilityLabel);
  }

  if (oldProps.accessibilityLabelledBy != newProps.accessibilityLabelledBy) {
    builder.putMapBuffer(
        VP_ACCESSIBILITY_LABELLED_BY,
        convertAccessibilityLabelledBy(newProps.accessibilityLabelledBy));
  }

  if (oldProps.accessibilityLiveRegion != newProps.accessibilityLiveRegion) {
    int value;
    switch (newProps.accessibilityLiveRegion) {
      case AccessibilityLiveRegion::None:
        value = 0;
        break;
      case AccessibilityLiveRegion::Polite:
        value = 1;
        break;
      case AccessibilityLiveRegion::Assertive:
        value = 2;
        break;
    }
    builder.putInt(VP_ACCESSIBILITY_LIVE_REGION, value);
  }

  if (oldProps.accessibilityRole != newProps.accessibilityRole) {
    builder.putString(VP_ACCESSIBILITY_ROLE, newProps.accessibilityRole);
  }

  if (oldProps.accessibilityState != newProps.accessibilityState) {
    builder.putMapBuffer(
        VP_ACCESSIBILITY_STATE,
        convertAccessibilityState(newProps.accessibilityState));
  }

  if (oldProps.accessibilityValue != newProps.accessibilityValue) {
    builder.putString(
        VP_ACCESSIBILITY_VALUE, newProps.accessibilityValue.text.value_or(""));
  }

  if (oldProps.accessible != newProps.accessible) {
    builder.putBool(VP_ACCESSIBLE, newProps.accessible);
  }

  if (oldProps.backfaceVisibility != newProps.backfaceVisibility) {
    int value;
    switch (newProps.backfaceVisibility) {
      case BackfaceVisibility::Auto:
        value = 0;
        break;
      case BackfaceVisibility::Visible:
        value = 1;
        break;
      case BackfaceVisibility::Hidden:
        value = 2;
        break;
    }
    builder.putInt(VP_BACKFACE_VISIBILITY, value);
  }

  if (oldProps.backgroundColor != newProps.backgroundColor) {
    builder.putInt(VP_BG_COLOR, toAndroidRepr(newProps.backgroundColor));
  }

  if (oldProps.borderColors != newProps.borderColors) {
    builder.putMapBuffer(
        VP_BORDER_COLOR, convertBorderColors(newProps.borderColors));
  }

  if (oldProps.borderRadii != newProps.borderRadii) {
    builder.putMapBuffer(
        VP_BORDER_RADII, convertBorderRadii(newProps.borderRadii));
  }

  if (oldProps.borderStyles != newProps.borderStyles) {
    int value = -1;
    if (newProps.borderStyles.all.has_value()) {
      switch (newProps.borderStyles.all.value()) {
        case BorderStyle::Solid:
          value = 0;
          break;
        case BorderStyle::Dotted:
          value = 1;
          break;
        case BorderStyle::Dashed:
          value = 2;
          break;
      }
    }
    builder.putInt(VP_BORDER_STYLE, value);
  }

  if (oldProps.elevation != newProps.elevation) {
    builder.putDouble(VP_ELEVATION, newProps.elevation);
  }

#ifdef ANDROID
  if (oldProps.focusable != newProps.focusable) {
    builder.putBool(VP_FOCUSABLE, newProps.focusable);
  }

  if (oldProps.hasTVPreferredFocus != newProps.hasTVPreferredFocus) {
    builder.putBool(VP_HAS_TV_FOCUS, newProps.hasTVPreferredFocus);
  }
#endif

  if (oldProps.hitSlop != newProps.hitSlop) {
    builder.putMapBuffer(VP_HIT_SLOP, convertEdgeInsets(newProps.hitSlop));
  }

  if (oldProps.importantForAccessibility !=
      newProps.importantForAccessibility) {
    int value;
    switch (newProps.importantForAccessibility) {
      case ImportantForAccessibility::Auto:
        value = 0;
        break;
      case ImportantForAccessibility::Yes:
        value = 1;
        break;
      case ImportantForAccessibility::No:
        value = 2;
        break;
      case ImportantForAccessibility::NoHideDescendants:
        value = 3;
        break;
    }
    builder.putInt(VP_IMPORTANT_FOR_ACCESSIBILITY, value);
  }

#ifdef ANDROID
  if (oldProps.nativeBackground != newProps.nativeBackground) {
    builder.putMapBuffer(
        VP_NATIVE_BACKGROUND,
        convertNativeBackground(newProps.nativeBackground));
  }

  if (oldProps.nativeForeground != newProps.nativeForeground) {
    builder.putMapBuffer(
        VP_NATIVE_FOREGROUND,
        convertNativeBackground(newProps.nativeForeground));
  }
#endif

  if (oldProps.nativeId != newProps.nativeId) {
    builder.putString(VP_NATIVE_ID, newProps.nativeId);
  }

#ifdef ANDROID
  if (oldProps.needsOffscreenAlphaCompositing !=
      newProps.needsOffscreenAlphaCompositing) {
    builder.putBool(
        VP_OFFSCREEN_ALPHA_COMPOSITING,
        newProps.needsOffscreenAlphaCompositing);
  }
#endif

  if (oldProps.opacity != newProps.opacity) {
    builder.putDouble(VP_OPACITY, newProps.opacity);
  }

  if (oldProps.pointerEvents != newProps.pointerEvents) {
    int value;
    switch (newProps.pointerEvents) {
      case PointerEventsMode::Auto:
        value = 0;
        break;
      case PointerEventsMode::None:
        value = 1;
        break;
      case PointerEventsMode::BoxNone:
        value = 2;
        break;
      case PointerEventsMode::BoxOnly:
        value = 3;
        break;
    }

    builder.putInt(VP_POINTER_EVENTS, value);
  }

  if (oldProps.events != newProps.events) {
    builder.putBool(
        VP_POINTER_ENTER, newProps.events[ViewEvents::Offset::PointerEnter]);
    builder.putBool(
        VP_POINTER_LEAVE, newProps.events[ViewEvents::Offset::PointerLeave]);
    builder.putBool(
        VP_POINTER_MOVE, newProps.events[ViewEvents::Offset::PointerMove]);

    builder.putBool(
        VP_POINTER_ENTER_CAPTURE,
        newProps.events[ViewEvents::Offset::PointerEnterCapture]);
    builder.putBool(
        VP_POINTER_LEAVE_CAPTURE,
        newProps.events[ViewEvents::Offset::PointerLeaveCapture]);
    builder.putBool(
        VP_POINTER_MOVE_CAPTURE,
        newProps.events[ViewEvents::Offset::PointerMoveCapture]);
  }

  if (oldProps.removeClippedSubviews != newProps.removeClippedSubviews) {
    builder.putBool(VP_REMOVE_CLIPPED_SUBVIEW, newProps.removeClippedSubviews);
  }

#ifdef ANDROID
  if (oldProps.renderToHardwareTextureAndroid !=
      newProps.renderToHardwareTextureAndroid) {
    builder.putBool(
        VP_RENDER_TO_HARDWARE_TEXTURE, newProps.renderToHardwareTextureAndroid);
  }
#endif

  if (oldProps.shadowColor != newProps.shadowColor) {
    builder.putInt(VP_SHADOW_COLOR, toAndroidRepr(newProps.shadowColor));
  }

  if (oldProps.testId != newProps.testId) {
    builder.putString(VP_TEST_ID, newProps.testId);
  }

  // TODO: seems like transform covers rotation/translate/scale/skew?

  if (oldProps.transform != newProps.transform) {
    builder.putMapBuffer(VP_TRANSFORM, convertTransform(newProps.transform));
  }

  if (oldProps.zIndex != newProps.zIndex) {
    builder.putInt(VP_ZINDEX, newProps.zIndex.value_or(0));
  }

  if (oldProps.yogaStyle != newProps.yogaStyle) {
    auto const &oldStyle = oldProps.yogaStyle;
    auto const &newStyle = newProps.yogaStyle;

    if (!(oldStyle.border() == newStyle.border())) {
      builder.putMapBuffer(
          YG_BORDER_WIDTH, convertBorderWidths(newStyle.border()));
    }

    if (oldStyle.overflow() != newStyle.overflow()) {
      int value;
      switch (newStyle.overflow()) {
        case YGOverflowVisible:
          value = 0;
          break;
        case YGOverflowHidden:
          value = 1;
          break;
        case YGOverflowScroll:
          value = 2;
          break;
      }
      builder.putInt(YG_OVERFLOW, value);
    }
  }

  return builder.build();
}

} // namespace react
} // namespace facebook
