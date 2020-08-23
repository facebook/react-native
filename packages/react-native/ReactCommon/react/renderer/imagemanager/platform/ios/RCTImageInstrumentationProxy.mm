/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageInstrumentationProxy.h"

namespace facebook {
namespace react {

RCTImageInstrumentationProxy::RCTImageInstrumentationProxy(id<RCTImageLoaderWithAttributionProtocol> imageLoader)
    : imageLoader_(imageLoader)
{
}

RCTImageInstrumentationProxy::~RCTImageInstrumentationProxy()
{
  if (!imageURLLoaderRequest_) {
    return;
  }
  [imageLoader_ trackURLImageDidDestroy:imageURLLoaderRequest_];
}

void RCTImageInstrumentationProxy::didSetImage() const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  if (!imageURLLoaderRequest_) {
    return;
  }

  [imageLoader_ trackURLImageContentDidSetForRequest:imageURLLoaderRequest_];
}

void RCTImageInstrumentationProxy::didEnterVisibilityRange() const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
  if (!imageURLLoaderRequest_) {
    return;
  }
}

void RCTImageInstrumentationProxy::didExitVisibilityRange() const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
  if (!imageURLLoaderRequest_) {
    return;
  }
}

void RCTImageInstrumentationProxy::trackNativeImageView(UIView *imageView) const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  if (!imageURLLoaderRequest_) {
    return;
  }
  [imageLoader_ trackURLImageVisibilityForRequest:imageURLLoaderRequest_ imageView:imageView];
}

void RCTImageInstrumentationProxy::setImageURLLoaderRequest(RCTImageURLLoaderRequest *request)
{
  imageURLLoaderRequest_ = request;
}

} // namespace react
} // namespace facebook
