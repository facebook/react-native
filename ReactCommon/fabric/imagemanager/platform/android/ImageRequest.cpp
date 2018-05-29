/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageRequest.h"

namespace facebook {
namespace react {

ImageRequest::ImageRequest() {}

ImageRequest::ImageRequest(
    const ImageSource &imageSource,
    folly::Future<ImageResponse> &&responseFuture) {
  // Not implemented.
}

ImageRequest::ImageRequest(ImageRequest &&other) noexcept
    : imageSource_(std::move(other.imageSource_)),
      responseFutureSplitter_(std::move(other.responseFutureSplitter_)) {
  // Not implemented.
}

ImageRequest::~ImageRequest() {
  // Not implemented.
}

folly::Future<ImageResponse> ImageRequest::getResponseFuture() const {
  // Not implemented.
  abort();
}

} // namespace react
} // namespace facebook
