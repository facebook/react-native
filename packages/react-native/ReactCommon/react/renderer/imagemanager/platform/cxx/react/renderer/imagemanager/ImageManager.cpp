/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageManager.h"

namespace facebook::react {

ImageManager::ImageManager(
    const ContextContainer::Shared& /*contextContainer*/) {
  // Silence unused-private-field warning.
  (void)self_;
  // Not implemented.
}

ImageManager::~ImageManager() {
  // Not implemented.
}

ImageRequest ImageManager::requestImage(
    const ImageSource& imageSource,
    SurfaceId /*surfaceId*/) const {
  // Not implemented.
  return {imageSource, nullptr, {}};
}

} // namespace facebook::react
