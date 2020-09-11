/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageTelemetry.h"

namespace facebook {
namespace react {

SurfaceId ImageTelemetry::getSurfaceId() const {
  return surfaceId_;
}

std::string ImageTelemetry::getLoaderModuleName() const {
  return loaderModuleName_;
}

void ImageTelemetry::setLoaderModuleName(std::string const &loaderModuleName) {
  loaderModuleName_ = loaderModuleName;
}

} // namespace react
} // namespace facebook
