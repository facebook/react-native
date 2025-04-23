/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageState.h"

namespace facebook::react {

ImageSource ImageState::getImageSource() const {
  return imageSource_;
}

const ImageRequest& ImageState::getImageRequest() const {
  return *imageRequest_;
}
const ImageRequestParams& ImageState::getImageRequestParams() const {
  return imageRequestParams_;
}

} // namespace facebook::react
