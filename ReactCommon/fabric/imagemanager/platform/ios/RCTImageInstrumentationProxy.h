/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <React/RCTImageLoaderWithAttributionProtocol.h>

#include <react/core/ReactPrimitives.h>
#include <react/imagemanager/ImageInstrumentation.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook {
namespace react {

class RCTImageInstrumentationProxy final : public ImageInstrumentation {
 public:
  RCTImageInstrumentationProxy(id<RCTImageLoaderWithAttributionProtocol> imageLoader);
  ~RCTImageInstrumentationProxy();

  void didSetImage() const override;
  void didEnterVisibilityRange() const override;
  void didExitVisibilityRange() const override;

  void trackNativeImageView(UIView *imageView) const;
  void setImageURLLoaderRequest(RCTImageURLLoaderRequest *request);

 private:
  __weak id<RCTImageLoaderWithAttributionProtocol> imageLoader_;
  RCTImageURLLoaderRequest *imageURLLoaderRequest_;
};

} // namespace react
} // namespace facebook

NS_ASSUME_NONNULL_END
