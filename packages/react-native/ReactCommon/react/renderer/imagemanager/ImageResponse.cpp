/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageResponse.h"

#include <utility>

namespace facebook::react {

ImageResponse::ImageResponse(
    std::shared_ptr<void> image,
    std::shared_ptr<void> metadata)
    : image_(std::move(image)), metadata_(std::move(metadata)) {}

std::shared_ptr<void> ImageResponse::getImage() const {
  return image_;
}

std::shared_ptr<void> ImageResponse::getMetadata() const {
  return metadata_;
}

} // namespace facebook::react
