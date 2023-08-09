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

namespace facebook {
namespace react {

namespace {

constexpr MapBuffer::Key EDGE_TOP = 0;
constexpr MapBuffer::Key EDGE_LEFT = 1;
constexpr MapBuffer::Key EDGE_RIGHT = 2;
constexpr MapBuffer::Key EDGE_BOTTOM = 3;
constexpr MapBuffer::Key EDGE_START = 4;
constexpr MapBuffer::Key EDGE_END = 5;
constexpr MapBuffer::Key EDGE_ALL = 6;
constexpr MapBuffer::Key EDGE_BLOCK = 7;
constexpr MapBuffer::Key EDGE_BLOCK_START = 8;
constexpr MapBuffer::Key EDGE_BLOCK_END = 9;

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
    MapBufferBuilder &builder,
    MapBuffer::Key key,
    std::optional<Float> const &value) {
  builder.putDouble(key, value.value_or(NAN));
}

inline std::optional<Float> optionalFromValue(
    std::optional<BorderCurve> const &value) {
  if (!value) {
    return {};
  }

  return {value.value() == BorderCurve::Circular ? 1 : 2};
}

inline std::optional<Float> optionalFromValue(
    std::optional<Float> const &value) {
  return value;
}

inline std::optional<Float> optionalFromValue(
    std::optional<BorderStyle> const &value) {
  if (!value) {
    return {};
  }

  int intValue = -1;
  switch (value.value()) {
    case BorderStyle::Solid:
      intValue = 0;
      break;
    case BorderStyle::Dotted:
      intValue = 1;
      break;
    case BorderStyle::Dashed:
      intValue = 2;
      break;
  }

  return {intValue};
}

inline void putOptionalColor(
    MapBufferBuilder &builder,
    MapBuffer::Key key,
    std::optional<SharedColor> const &color) {
  builder.putInt(key, color.has_value() ? toAndroidRepr(color.value()) : -1);
}

inline MapBuffer convertBorderColors(CascadedBorderColors const &colors) {
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

template <typename T>
MapBuffer convertCascadedEdges(CascadedRectangleEdges<T> const &edges) {
  MapBufferBuilder builder(10);
  putOptionalFloat(builder, EDGE_TOP, optionalFromValue(edges.top));
  putOptionalFloat(builder, EDGE_RIGHT, optionalFromValue(edges.right));
  putOptionalFloat(builder, EDGE_BOTTOM, optionalFromValue(edges.bottom));
  putOptionalFloat(builder, EDGE_LEFT, optionalFromValue(edges.left));
  putOptionalFloat(builder, EDGE_START, optionalFromValue(edges.start));
  putOptionalFloat(builder, EDGE_END, optionalFromValue(edges.end));
  putOptionalFloat(builder, EDGE_BLOCK, optionalFromValue(edges.block));
  putOptionalFloat(builder, EDGE_BLOCK_END, optionalFromValue(edges.blockEnd));
  putOptionalFloat(
      builder, EDGE_BLOCK_START, optionalFromValue(edges.blockStart));
  putOptionalFloat(builder, EDGE_ALL, optionalFromValue(edges.all));
  return builder.build();
}

template <typename T>
MapBuffer convertCascadedCorners(CascadedRectangleCorners<T> const &corners) {
  MapBufferBuilder builder(13);
  putOptionalFloat(
      builder, CORNER_TOP_LEFT, optionalFromValue(corners.topLeft));
  putOptionalFloat(
      builder, CORNER_TOP_RIGHT, optionalFromValue(corners.topRight));
  putOptionalFloat(
      builder, CORNER_BOTTOM_RIGHT, optionalFromValue(corners.bottomRight));
  putOptionalFloat(
      builder, CORNER_BOTTOM_LEFT, optionalFromValue(corners.bottomLeft));
  putOptionalFloat(
      builder, CORNER_TOP_START, optionalFromValue(corners.topStart));
  putOptionalFloat(builder, CORNER_TOP_END, optionalFromValue(corners.topEnd));
  putOptionalFloat(
      builder, CORNER_BOTTOM_END, optionalFromValue(corners.bottomEnd));
  putOptionalFloat(
      builder, CORNER_BOTTOM_START, optionalFromValue(corners.bottomStart));
  putOptionalFloat(builder, CORNER_END_END, optionalFromValue(corners.endEnd));
  putOptionalFloat(
      builder, CORNER_END_START, optionalFromValue(corners.endStart));
  putOptionalFloat(
      builder, CORNER_START_END, optionalFromValue(corners.startEnd));
  putOptionalFloat(
      builder, CORNER_START_START, optionalFromValue(corners.startStart));
  putOptionalFloat(builder, CORNER_ALL, optionalFromValue(corners.all));
  return builder.build();
}

inline MapBuffer convertEdgeInsets(EdgeInsets const &insets) {
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

inline MapBuffer convertNativeBackground(
    std::optional<NativeDrawable> const &value) {
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

inline MapBuffer convertTransform(Transform const &transform) {
  MapBufferBuilder builder(16);
  for (int32_t i = 0; i < transform.matrix.size(); i++) {
    builder.putDouble(i, transform.matrix[i]);
  }
  return builder.build();
}
} // namespace

} // namespace react
} // namespace facebook
