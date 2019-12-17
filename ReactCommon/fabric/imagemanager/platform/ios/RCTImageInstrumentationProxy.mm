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

void RCTImageInstrumentationProxy::didSetImage() const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
  if (imageLoader_) {
  }
}

void RCTImageInstrumentationProxy::didEnterVisibilityRange() const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
}

void RCTImageInstrumentationProxy::didExitVisibilityRange() const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
}

void RCTImageInstrumentationProxy::trackNativeImageView(UIView *imageView) const
{
  if (!RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
}

} // namespace react
} // namespace facebook
