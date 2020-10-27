/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageTelemetry.h"

namespace facebook {
namespace react {

void ImageTelemetry::willRequestUrl() {
  assert(willRequestUrlTime_ == kTelemetryUndefinedTimePoint);
  willRequestUrlTime_ = telemetryTimePointNow();
}

SurfaceId ImageTelemetry::getSurfaceId() const {
  return surfaceId_;
}

std::string ImageTelemetry::getLoaderModuleName() const {
  return loaderModuleName_;
}

void ImageTelemetry::setLoaderModuleName(std::string const &loaderModuleName) {
  loaderModuleName_ = loaderModuleName;
}

TelemetryTimePoint ImageTelemetry::getWillRequestUrlTime() const {
  assert(willRequestUrlTime_ != kTelemetryUndefinedTimePoint);
  return willRequestUrlTime_;
}

} // namespace react
} // namespace facebook
