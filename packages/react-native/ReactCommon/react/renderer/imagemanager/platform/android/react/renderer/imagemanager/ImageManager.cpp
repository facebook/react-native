/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageManager.h"
#include "ImageFetcher.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react {

ImageManager::ImageManager(const ContextContainer::Shared& contextContainer)
    : self_(new ImageFetcher(contextContainer)) {}

ImageManager::~ImageManager() {
  delete static_cast<ImageFetcher*>(self_);
}

ImageRequest ImageManager::requestImage(
    const ImageSource& imageSource,
    SurfaceId surfaceId) const {
  return requestImage(imageSource, surfaceId, ImageRequestParams{}, {});
}

ImageRequest ImageManager::requestImage(
    const ImageSource& imageSource,
    SurfaceId surfaceId,
    const ImageRequestParams& imageRequestParams,
    Tag tag) const {
  if (ReactNativeFeatureFlags::enableImagePrefetchingAndroid()) {
    return static_cast<ImageFetcher*>(self_)->requestImage(
        imageSource, imageRequestParams, surfaceId, tag);
  }
  return {imageSource, nullptr, {}};
}

} // namespace facebook::react
