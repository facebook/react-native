/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/imagemanager/ImageRequest.h>
#include <fabric/imagemanager/primitives.h>

namespace facebook {
namespace react {

class ImageManager;

using SharedImageManager = std::shared_ptr<ImageManager>;

/*
 * Cross platform facade for iOS-specific RCTImageManager.
 */
class ImageManager {
public:

  ImageManager(void *platformSpecificCounterpart);
  ~ImageManager();

  ImageRequest requestImage(const ImageSource &imageSource) const;

private:
  void *self_;
};

} // namespace react
} // namespace facebook
