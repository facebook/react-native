/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include <react/renderer/imagemanager/primitives.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#include <react/utils/to_underlying.h>
#include <vector>

namespace facebook::react {

namespace {

constexpr MapBuffer::Key IS_KEY_URI = 0;
constexpr MapBuffer::Key IS_KEY_DEFAULT_SRC = 1;
constexpr MapBuffer::Key IS_KEY_RESIZE_MODE = 2;
constexpr MapBuffer::Key IS_KEY_RESIZE_METHOD = 3;
constexpr MapBuffer::Key IS_KEY_BLUR_RADIUS = 4;
constexpr MapBuffer::Key IS_KEY_VIEW_WIDTH = 5;
constexpr MapBuffer::Key IS_KEY_VIEW_HEIGHT = 6;
constexpr MapBuffer::Key IS_KEY_RESIZE_MULTIPLIER = 7;
constexpr MapBuffer::Key IS_KEY_SHOULD_NOTIFY_LOAD_EVENTS = 8;
constexpr MapBuffer::Key IS_KEY_OVERLAY_COLOR = 9;
constexpr MapBuffer::Key IS_KEY_TINT_COLOR = 10;
constexpr MapBuffer::Key IS_KEY_FADE_DURATION = 11;
constexpr MapBuffer::Key IS_KEY_PROGRESSIVE_RENDERING_ENABLED = 12;
constexpr MapBuffer::Key IS_KEY_LOADING_INDICATOR_SRC = 13;
constexpr MapBuffer::Key IS_KEY_ANALYTIC_TAG = 14;
constexpr MapBuffer::Key IS_KEY_SURFACE_ID = 15;
constexpr MapBuffer::Key IS_KEY_TAG = 16;

inline void serializeImageSource(
    MapBufferBuilder& builder,
    const ImageSource& imageSource) {
  builder.putString(IS_KEY_URI, imageSource.uri);
  builder.putInt(
      IS_KEY_VIEW_WIDTH, static_cast<int32_t>(imageSource.size.width));
  builder.putInt(
      IS_KEY_VIEW_HEIGHT, static_cast<int32_t>(imageSource.size.height));
}

inline void serializeImageRequestParams(
    MapBufferBuilder& builder,
    const ImageRequestParams& imageRequestParams) {
  builder.putString(IS_KEY_DEFAULT_SRC, imageRequestParams.defaultSource.uri);
  builder.putInt(
      IS_KEY_RESIZE_MODE, to_underlying(imageRequestParams.resizeMode));
  builder.putString(IS_KEY_RESIZE_METHOD, imageRequestParams.resizeMethod);
  builder.putInt(
      IS_KEY_BLUR_RADIUS, static_cast<int32_t>(imageRequestParams.blurRadius));
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
  builder.putInt(
      IS_KEY_FADE_DURATION,
      static_cast<int32_t>(imageRequestParams.fadeDuration));
  builder.putBool(
      IS_KEY_PROGRESSIVE_RENDERING_ENABLED,
      imageRequestParams.progressiveRenderingEnabled);
  builder.putString(
      IS_KEY_LOADING_INDICATOR_SRC,
      imageRequestParams.loadingIndicatorSource.uri);
  builder.putString(IS_KEY_ANALYTIC_TAG, imageRequestParams.analyticTag);
}

inline MapBuffer serializeImageRequest(const ImageRequestItem& item) {
  auto builder = MapBufferBuilder();
  serializeImageSource(builder, item.imageSource);
  serializeImageRequestParams(builder, item.imageRequestParams);
  builder.putInt(IS_KEY_SURFACE_ID, item.surfaceId);
  builder.putInt(IS_KEY_TAG, item.tag);
  return builder.build();
}

} // namespace

inline MapBuffer serializeImageRequests(
    const std::vector<ImageRequestItem>& items) {
  std::vector<MapBuffer> mapBufferList;
  mapBufferList.reserve(items.size());
  for (const auto& item : items) {
    mapBufferList.emplace_back(serializeImageRequest(item));
  }
  MapBufferBuilder builder;
  builder.putMapBufferList(0, mapBufferList);
  return builder.build();
}

} // namespace facebook::react
