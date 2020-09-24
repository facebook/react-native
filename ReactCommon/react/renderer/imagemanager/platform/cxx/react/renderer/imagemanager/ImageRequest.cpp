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
    std::shared_ptr<const ImageTelemetry> telemetry,
    std::shared_ptr<const ImageInstrumentation> instrumentation)
    : imageSource_(imageSource),
      telemetry_(telemetry),
      instrumentation_(instrumentation) {
  // Not implemented.
}

ImageRequest::ImageRequest(ImageRequest &&other) noexcept
    : imageSource_(std::move(other.imageSource_)),
      telemetry_(std::move(other.telemetry_)),
      coordinator_(std::move(other.coordinator_)),
      instrumentation_(std::move(other.instrumentation_)) {
  // Not implemented.
}

ImageRequest::~ImageRequest() {
  // Not implemented.
}

const ImageResponseObserverCoordinator &ImageRequest::getObserverCoordinator()
    const {
  // Not implemented
  abort();
}

const std::shared_ptr<const ImageResponseObserverCoordinator>
    &ImageRequest::getSharedObserverCoordinator() const {
  // Not implemented
  abort();
}

const std::shared_ptr<const ImageInstrumentation>
    &ImageRequest::getSharedImageInstrumentation() const {
  // Not implemented
  abort();
}

const ImageInstrumentation &ImageRequest::getImageInstrumentation() const {
  // Not implemented
  abort();
}

} // namespace react
} // namespace facebook
