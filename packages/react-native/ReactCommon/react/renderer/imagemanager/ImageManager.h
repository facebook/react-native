/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/imagemanager/ImageRequest.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include <react/renderer/imagemanager/primitives.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class ImageManager;

using SharedImageManager [[deprecated("Use std::shared_ptr<ImageManager> instead.")]] = std::shared_ptr<ImageManager>;

/*
 * Cross platform facade for image management (e.g. iOS-specific
 * RCTImageManager)
 */
class ImageManager {
 public:
  ImageManager(const std::shared_ptr<const ContextContainer> &contextContainer);
  virtual ~ImageManager();

  virtual ImageRequest requestImage(
      const ImageSource &imageSource,
      SurfaceId surfaceId,
      const ImageRequestParams &imageRequestParams = {},
      Tag tag = {}) const;

 private:
  void *self_{};
};

} // namespace facebook::react
