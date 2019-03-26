/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageRequest.h"

namespace facebook {
namespace react {

class ImageRequest::ImageNoLongerNeededException:
  public std::logic_error {
public:
  ImageNoLongerNeededException():
    std::logic_error("Image no longer needed.") {}
};

ImageRequest::ImageRequest(const ImageSource &imageSource, folly::Future<ImageResponse> &&responseFuture):
  imageSource_(imageSource),
  responseFutureSplitter_(folly::splitFuture(std::move(responseFuture))) {}

ImageRequest::ImageRequest(ImageRequest &&other) noexcept:
  imageSource_(std::move(other.imageSource_)),
  responseFutureSplitter_(std::move(other.responseFutureSplitter_)) {
    other.moved_ = true;
  };

ImageRequest::~ImageRequest() {
  if (!moved_) {
    auto future = responseFutureSplitter_.getFuture();
    if (!future.isReady()) {
      future.raise(ImageNoLongerNeededException());
    }
  }
}

folly::Future<ImageResponse> ImageRequest::getResponseFuture() const {
  if (moved_) {
    abort();
  }

  std::lock_guard<std::mutex> lock(mutex_);
  return responseFutureSplitter_.getFuture();
}

} // namespace react
} // namespace facebook
