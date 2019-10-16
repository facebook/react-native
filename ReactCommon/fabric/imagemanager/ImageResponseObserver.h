/*
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
 * All methods must be thread-safe.
 */
class ImageResponseObserver {
 public:
  virtual ~ImageResponseObserver() noexcept = default;

  virtual void didReceiveProgress(float progress) const = 0;
  virtual void didReceiveImage(ImageResponse const &imageResponse) const = 0;
  virtual void didReceiveFailure() const = 0;
};

} // namespace react
} // namespace facebook
