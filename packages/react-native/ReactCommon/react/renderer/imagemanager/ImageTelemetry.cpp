/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageTelemetry.h"

namespace facebook::react {

SurfaceId ImageTelemetry::getSurfaceId() const {
  return surfaceId_;
}

TelemetryTimePoint ImageTelemetry::getWillRequestUrlTime() const {
  return willRequestUrlTime_;
}

} // namespace facebook::react
