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
#include <memory>
#include <unordered_map>
#include <vector>

namespace facebook::react {

class ImageFetcher {
 public:
  ImageFetcher(std::shared_ptr<const ContextContainer> contextContainer);
  ~ImageFetcher() = default;
  ImageFetcher(const ImageFetcher&) = delete;
  ImageFetcher& operator=(const ImageFetcher&) = delete;
  ImageFetcher(ImageFetcher&&) = delete;
  ImageFetcher& operator=(ImageFetcher&&) = delete;

  ImageRequest requestImage(
      const ImageSource& imageSource,
      SurfaceId surfaceId,
      const ImageRequestParams& imageRequestParams,
      Tag tag);

 private:
  void flushImageRequests();

  std::unordered_map<SurfaceId, std::vector<ImageRequestItem>> items_;
  std::shared_ptr<const ContextContainer> contextContainer_;
};
} // namespace facebook::react
