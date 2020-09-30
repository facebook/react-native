/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageRequest.h"

namespace facebook {
namespace react {

ImageRequest::ImageRequest(const ImageSource &imageSource)
    : imageSource_(imageSource) {
  coordinator_ = std::make_shared<ImageResponseObserverCoordinator>();
}

ImageRequest::ImageRequest(ImageRequest &&other) noexcept
    : imageSource_(std::move(other.imageSource_)),
      coordinator_(std::move(other.coordinator_)) {
  other.moved_ = true;
  other.coordinator_ = nullptr;
  other.cancelRequest_ = nullptr;
}

ImageRequest::~ImageRequest() {
  if (cancelRequest_) {
    cancelRequest_();
  }
}

void ImageRequest::setCancelationFunction(
    std::function<void(void)> cancelationFunction) {
  cancelRequest_ = cancelationFunction;
}

const ImageResponseObserverCoordinator &ImageRequest::getObserverCoordinator()
    const {
  return *coordinator_;
}

const std::shared_ptr<const ImageResponseObserverCoordinator>
    &ImageRequest::getSharedObserverCoordinator() const {
  return coordinator_;
}

} // namespace react
} // namespace facebook
