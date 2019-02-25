/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/imagemanager/ImageResponse.h>

namespace facebook {
namespace react {

/*
 * Represents any observer of ImageResponse progression, completion, or failure.
 */
class ImageResponseObserver {
 public:
  virtual void didReceiveProgress(float) = 0;
  virtual void didReceiveImage(const ImageResponse &imageResponse) = 0;
  virtual void didReceiveFailure() = 0;
  virtual ~ImageResponseObserver() noexcept = default;
};

} // namespace react
} // namespace facebook
