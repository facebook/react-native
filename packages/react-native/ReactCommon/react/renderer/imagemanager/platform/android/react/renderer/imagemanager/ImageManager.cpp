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

namespace {

constexpr inline bool isInteger(const std::string& str) {
  return str.find_first_not_of("0123456789") == std::string::npos;
}

struct ImageFetcherHolder {
  explicit ImageFetcherHolder(
      const std::shared_ptr<const ContextContainer>& contextContainer)
      : imageFetcher_(std::make_shared<ImageFetcher>(contextContainer)) {}

  const std::shared_ptr<ImageFetcher> imageFetcher_;
};

} // namespace

ImageManager::ImageManager(
    const std::shared_ptr<const ContextContainer>& contextContainer)
    : self_(new ImageFetcherHolder(contextContainer)) {}

ImageManager::~ImageManager() {
  delete static_cast<ImageFetcherHolder*>(self_);
}

ImageRequest ImageManager::requestImage(
    const ImageSource& imageSource,
    SurfaceId surfaceId,
    const ImageRequestParams& imageRequestParams,
    Tag tag) const {
  if (ReactNativeFeatureFlags::enableImagePrefetchingAndroid()) {
    if (!isInteger(imageSource.uri)) {
      return static_cast<ImageFetcherHolder*>(self_)
          ->imageFetcher_->requestImage(
              imageSource, surfaceId, imageRequestParams, tag);
    }
  }
  return {imageSource, nullptr, {}};
}

} // namespace facebook::react
