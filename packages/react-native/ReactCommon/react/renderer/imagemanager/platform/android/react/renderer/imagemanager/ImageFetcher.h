/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/imagemanager/ImageRequest.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class ImageFetcher {
 public:
  ImageFetcher(std::shared_ptr<const ContextContainer> contextContainer)
      : contextContainer_(std::move(contextContainer)) {}

  ImageRequest requestImage(
      const ImageSource& imageSource,
      const ImageRequestParams& imageRequestParams,
      SurfaceId surfaceId,
      Tag tag) const;

 private:
  std::shared_ptr<const ContextContainer> contextContainer_;
};
} // namespace facebook::react
