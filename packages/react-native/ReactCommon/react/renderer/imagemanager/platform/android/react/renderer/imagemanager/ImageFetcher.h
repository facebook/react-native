/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/imagemanager/ImageRequest.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include <react/utils/ContextContainer.h>

#include <utility>

namespace facebook::react {

class ImageFetcher {
 public:
  ImageFetcher(ContextContainer::Shared contextContainer)
      : contextContainer_(std::move(contextContainer)) {}

  ImageRequest requestImage(
      const ImageSource& imageSource,
      const ImageRequestParams& imageRequestParams,
      SurfaceId surfaceId,
      Tag tag) const;

 private:
  ContextContainer::Shared contextContainer_;
};
} // namespace facebook::react
