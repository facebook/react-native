/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageResponse.h"

namespace facebook {
namespace react {

ImageResponse::ImageResponse(
    const std::shared_ptr<void> &image,
    const std::shared_ptr<void> &metadata)
    : image_(image), metadata_(metadata) {}

std::shared_ptr<void> ImageResponse::getImage() const {
  return image_;
}

std::shared_ptr<void> ImageResponse::getMetadata() const {
  return metadata_;
}

} // namespace react
} // namespace facebook
