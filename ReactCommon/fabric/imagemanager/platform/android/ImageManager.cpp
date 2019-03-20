/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageManager.h"

namespace facebook {
namespace react {

ImageManager::ImageManager(void *platformSpecificCounterpart) {
  // Silence unused-private-field warning.
  (void)self_;
  // Not implemented.
}

ImageManager::~ImageManager() {
  // Not implemented.
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource) const {
  // Not implemented.
  return ImageRequest(imageSource);
}

} // namespace react
} // namespace facebook
