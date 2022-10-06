/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef ANDROID

#include "ViewPropsMapBuffer.h"
#include "ViewProps.h"

#include "viewPropConversions.h"

#include <react/renderer/graphics/conversions.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace facebook {
namespace react {

// TODO: Currently unsupported: nextFocusForward/Left/Up/Right/Down
void ViewProps::propsDiffMapBuffer(
    Props const *oldPropsPtr,
    MapBufferBuilder &builder) const {
  // Call with default props if necessary
  if (oldPropsPtr == nullptr) {
    ViewProps defaultProps{};
    propsDiffMapBuffer(&defaultProps, builder);
    return;
  }

  // Delegate to base classes
  YogaStylableProps::propsDiffMapBuffer(oldPropsPtr, builder);
  AccessibilityProps::propsDiffMapBuffer(oldPropsPtr, builder);

  ViewProps const &oldProps = *(static_cast<const ViewProps *>(oldPropsPtr));
  ViewProps const &newProps = *this;

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

  if (oldProps.foregroundColor != newProps.foregroundColor) {
    builder.putInt(VP_FG_COLOR, toAndroidRepr(newProps.foregroundColor));
  }

  if (oldProps.borderCurves != newProps.borderCurves) {
    builder.putMapBuffer(
        VP_BORDER_CURVES, convertCascadedCorners(newProps.borderCurves));
  }

  if (oldProps.borderColors != newProps.borderColors) {
    builder.putMapBuffer(
        VP_BORDER_COLOR, convertBorderColors(newProps.borderColors));
  }

  if (oldProps.borderRadii != newProps.borderRadii) {
    builder.putMapBuffer(
        VP_BORDER_RADII, convertCascadedCorners(newProps.borderRadii));
  }

  if (oldProps.borderStyles != newProps.borderStyles) {
    builder.putMapBuffer(
        VP_BORDER_STYLE, convertCascadedEdges(newProps.borderStyles));
  }

  if (oldProps.elevation != newProps.elevation) {
    builder.putDouble(VP_ELEVATION, newProps.elevation);
  }

  if (oldProps.focusable != newProps.focusable) {
    builder.putBool(VP_FOCUSABLE, newProps.focusable);
  }

  if (oldProps.hasTVPreferredFocus != newProps.hasTVPreferredFocus) {
    builder.putBool(VP_HAS_TV_FOCUS, newProps.hasTVPreferredFocus);
  }

  if (oldProps.hitSlop != newProps.hitSlop) {
    builder.putMapBuffer(VP_HIT_SLOP, convertEdgeInsets(newProps.hitSlop));
  }

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

  if (oldProps.needsOffscreenAlphaCompositing !=
      newProps.needsOffscreenAlphaCompositing) {
    builder.putBool(
        VP_OFFSCREEN_ALPHA_COMPOSITING,
        newProps.needsOffscreenAlphaCompositing);
  }

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
    builder.putBool(
        VP_POINTER_OVER, newProps.events[ViewEvents::Offset::PointerOver]);
    builder.putBool(
        VP_POINTER_OVER_CAPTURE,
        newProps.events[ViewEvents::Offset::PointerOverCapture]);

    builder.putBool(
        VP_POINTER_OUT, newProps.events[ViewEvents::Offset::PointerOut]);
    builder.putBool(
        VP_POINTER_OUT_CAPTURE,
        newProps.events[ViewEvents::Offset::PointerOutCapture]);
  }

  if (oldProps.removeClippedSubviews != newProps.removeClippedSubviews) {
    builder.putBool(VP_REMOVE_CLIPPED_SUBVIEW, newProps.removeClippedSubviews);
  }

  if (oldProps.renderToHardwareTextureAndroid !=
      newProps.renderToHardwareTextureAndroid) {
    builder.putBool(
        VP_RENDER_TO_HARDWARE_TEXTURE, newProps.renderToHardwareTextureAndroid);
  }

  if (oldProps.shadowColor != newProps.shadowColor) {
    builder.putInt(VP_SHADOW_COLOR, toAndroidRepr(newProps.shadowColor));
  }

  if (oldProps.testId != newProps.testId) {
    builder.putString(VP_TEST_ID, newProps.testId);
  }

  if (oldProps.transform != newProps.transform) {
    builder.putMapBuffer(VP_TRANSFORM, convertTransform(newProps.transform));
  }

  if (oldProps.zIndex != newProps.zIndex) {
    builder.putInt(VP_ZINDEX, newProps.zIndex.value_or(0));
  }
}

} // namespace react
} // namespace facebook

#endif
