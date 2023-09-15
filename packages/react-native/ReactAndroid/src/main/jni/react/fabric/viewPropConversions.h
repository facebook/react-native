/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/components/view/ViewPropsMapBuffer.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

#include <optional>

namespace facebook::react {

namespace {
static MapBuffer convertAccessibilityActions(
    const std::vector<AccessibilityAction>& actions) {
  MapBufferBuilder builder(actions.size());
  for (auto i = 0; i < actions.size(); i++) {
    const auto& action = actions[i];
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
    const AccessibilityLabelledBy& labelledBy) {
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

MapBuffer convertAccessibilityState(const AccessibilityState& state) {
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
    MapBufferBuilder& builder,
    MapBuffer::Key key,
    const std::optional<SharedColor>& color) {
  builder.putInt(key, color.has_value() ? toAndroidRepr(color.value()) : -1);
}

constexpr MapBuffer::Key EDGE_TOP = 0;
constexpr MapBuffer::Key EDGE_LEFT = 1;
constexpr MapBuffer::Key EDGE_RIGHT = 2;
constexpr MapBuffer::Key EDGE_BOTTOM = 3;
constexpr MapBuffer::Key EDGE_START = 4;
constexpr MapBuffer::Key EDGE_END = 5;
constexpr MapBuffer::Key EDGE_ALL = 6;

MapBuffer convertBorderColors(const CascadedBorderColors& colors) {
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
constexpr MapBuffer::Key CORNER_END_END = 9;
constexpr MapBuffer::Key CORNER_END_START = 10;
constexpr MapBuffer::Key CORNER_START_END = 11;
constexpr MapBuffer::Key CORNER_START_START = 12;

inline void putOptionalFloat(
    MapBufferBuilder& builder,
    MapBuffer::Key key,
    const std::optional<Float>& value) {
  builder.putDouble(key, value.value_or(NAN));
}

MapBuffer convertBorderRadii(const CascadedBorderRadii& radii) {
  MapBufferBuilder builder(13);
  putOptionalFloat(builder, CORNER_TOP_LEFT, radii.topLeft);
  putOptionalFloat(builder, CORNER_TOP_RIGHT, radii.topRight);
  putOptionalFloat(builder, CORNER_BOTTOM_RIGHT, radii.bottomRight);
  putOptionalFloat(builder, CORNER_BOTTOM_LEFT, radii.bottomLeft);
  putOptionalFloat(builder, CORNER_TOP_START, radii.topStart);
  putOptionalFloat(builder, CORNER_TOP_END, radii.topEnd);
  putOptionalFloat(builder, CORNER_BOTTOM_END, radii.bottomEnd);
  putOptionalFloat(builder, CORNER_BOTTOM_START, radii.bottomStart);
  putOptionalFloat(builder, CORNER_ALL, radii.all);
  putOptionalFloat(builder, CORNER_END_END, radii.endEnd);
  putOptionalFloat(builder, CORNER_END_START, radii.endStart);
  putOptionalFloat(builder, CORNER_START_END, radii.startEnd);
  putOptionalFloat(builder, CORNER_START_START, radii.startStart);
  return builder.build();
}

MapBuffer convertBorderWidths(const yoga::Style::Edges& border) {
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

MapBuffer convertEdgeInsets(const EdgeInsets& insets) {
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

MapBuffer convertNativeBackground(const std::optional<NativeDrawable>& value) {
  if (!value.has_value()) {
    return MapBufferBuilder::EMPTY();
  }

  const auto& drawable = value.value();
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

MapBuffer convertTransform(const Transform& transform) {
  MapBufferBuilder builder(16);
  for (int32_t i = 0; i < transform.matrix.size(); i++) {
    builder.putDouble(i, transform.matrix[i]);
  }
  return builder.build();
}
} // namespace

} // namespace facebook::react
