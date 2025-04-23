/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageManager.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include "ImageFetcher.h"

namespace facebook::react {

ImageManager::ImageManager(const ContextContainer::Shared& contextContainer)
    : self_(new ImageFetcher(contextContainer)) {}

ImageManager::~ImageManager() {
  // @lint-ignore CLANGTIDY cppcoreguidelines-no-malloc
  free(self_);
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
  return {imageSource, nullptr, {}};
}

} // namespace facebook::react
