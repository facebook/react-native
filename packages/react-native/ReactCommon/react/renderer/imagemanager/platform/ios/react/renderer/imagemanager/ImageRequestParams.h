/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

class ImageRequestParams {
 public:
  ImageRequestParams() {}
  ImageRequestParams(Float blurRadius, ImageRequestPriority priority = ImageRequestPriority::Immediate)
      : blurRadius(blurRadius), priority(priority)
  {
  }

  Float blurRadius{};
  ImageRequestPriority priority{ImageRequestPriority::Immediate};

  bool operator==(const ImageRequestParams &rhs) const = default;
};

} // namespace facebook::react
