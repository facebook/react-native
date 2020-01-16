/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageRequest.h"

namespace facebook {
namespace react {

ImageRequest::ImageRequest(
    const ImageSource &imageSource,
    std::shared_ptr<const ImageInstrumentation> instrumentation)
    : imageSource_(imageSource), instrumentation_(instrumentation) {
  coordinator_ = std::make_shared<ImageResponseObserverCoordinator>();
}

ImageRequest::ImageRequest(ImageRequest &&other) noexcept
    : imageSource_(std::move(other.imageSource_)),
      coordinator_(std::move(other.coordinator_)),
      instrumentation_(std::move(other.instrumentation_)) {
  other.moved_ = true;
  other.coordinator_ = nullptr;
  other.cancelRequest_ = nullptr;
  other.instrumentation_ = nullptr;
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

const std::shared_ptr<const ImageInstrumentation>
    &ImageRequest::getSharedImageInstrumentation() const {
  return instrumentation_;
}

const ImageInstrumentation &ImageRequest::getImageInstrumentation() const {
  return *instrumentation_;
}

} // namespace react
} // namespace facebook
