/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include <react/renderer/imagemanager/primitives.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace facebook::react {

inline std::string toString(const ImageResizeMode& value) {
  switch (value) {
    case ImageResizeMode::Cover:
      return "cover";
    case ImageResizeMode::Contain:
      return "contain";
    case ImageResizeMode::Stretch:
      return "stretch";
    case ImageResizeMode::Center:
      return "center";
    case ImageResizeMode::Repeat:
      return "repeat";
    case ImageResizeMode::None:
      return "none";
  }
}

constexpr static MapBuffer::Key IS_KEY_URI = 0;
constexpr static MapBuffer::Key IS_KEY_DEFAULT_SRC = 1;
constexpr static MapBuffer::Key IS_KEY_RESIZE_MODE = 2;
constexpr static MapBuffer::Key IS_KEY_RESIZE_METHOD = 3;
constexpr static MapBuffer::Key IS_KEY_BLUR_RADIUS = 4;
constexpr static MapBuffer::Key IS_KEY_VIEW_WIDTH = 5;
constexpr static MapBuffer::Key IS_KEY_VIEW_HEIGHT = 6;
constexpr static MapBuffer::Key IS_KEY_RESIZE_MULTIPLIER = 7;
constexpr static MapBuffer::Key IS_KEY_SHOULD_NOTIFY_LOAD_EVENTS = 8;
constexpr static MapBuffer::Key IS_KEY_OVERLAY_COLOR = 9;
constexpr static MapBuffer::Key IS_KEY_TINT_COLOR = 10;
constexpr static MapBuffer::Key IS_KEY_FADE_DURATION = 11;
constexpr static MapBuffer::Key IS_KEY_PROGRESSIVE_RENDERING_ENABLED = 12;
constexpr static MapBuffer::Key IS_KEY_LOADING_INDICATOR_SRC = 13;
constexpr static MapBuffer::Key IS_KEY_ANALYTIC_TAG = 14;

inline void serializeImageSource(
    MapBufferBuilder& builder,
    const ImageSource& imageSource) {
  builder.putString(IS_KEY_URI, imageSource.uri);
  builder.putDouble(IS_KEY_VIEW_WIDTH, imageSource.size.width);
  builder.putDouble(IS_KEY_VIEW_HEIGHT, imageSource.size.height);
}

inline void serializeImageRequestParams(
    MapBufferBuilder& builder,
    const ImageRequestParams& imageRequestParams) {
  builder.putString(IS_KEY_DEFAULT_SRC, imageRequestParams.defaultSource.uri);
  builder.putString(
      IS_KEY_RESIZE_MODE, toString(imageRequestParams.resizeMode));
  builder.putString(IS_KEY_RESIZE_METHOD, imageRequestParams.resizeMethod);
  builder.putDouble(IS_KEY_BLUR_RADIUS, imageRequestParams.blurRadius);
  builder.putDouble(
      IS_KEY_RESIZE_MULTIPLIER, imageRequestParams.resizeMultiplier);
  builder.putBool(
      IS_KEY_SHOULD_NOTIFY_LOAD_EVENTS,
      imageRequestParams.shouldNotifyLoadEvents);
  if (isColorMeaningful(imageRequestParams.overlayColor)) {
    builder.putInt(
        IS_KEY_OVERLAY_COLOR, toAndroidRepr(imageRequestParams.overlayColor));
  }
  if (isColorMeaningful(imageRequestParams.tintColor)) {
    builder.putInt(
        IS_KEY_TINT_COLOR, toAndroidRepr(imageRequestParams.tintColor));
  }
  builder.putDouble(IS_KEY_FADE_DURATION, imageRequestParams.fadeDuration);
  builder.putBool(
      IS_KEY_PROGRESSIVE_RENDERING_ENABLED,
      imageRequestParams.progressiveRenderingEnabled);
  builder.putString(
      IS_KEY_LOADING_INDICATOR_SRC,
      imageRequestParams.loadingIndicatorSource.uri);
  builder.putString(IS_KEY_ANALYTIC_TAG, imageRequestParams.analyticTag);
}

inline MapBuffer serializeImageRequest(
    const ImageSource& imageSource,
    const ImageRequestParams& imageRequestParams) {
  auto builder = MapBufferBuilder();
  serializeImageSource(builder, imageSource);
  serializeImageRequestParams(builder, imageRequestParams);
  return builder.build();
}

} // namespace facebook::react
