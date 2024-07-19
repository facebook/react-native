/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageResponseObserverProxy.h"

#import <React/RCTUtils.h>
#import <react/renderer/imagemanager/ImageResponse.h>
#import <react/renderer/imagemanager/ImageResponseObserver.h>
#import <react/utils/ManagedObjectWrapper.h>

namespace facebook::react {

RCTImageResponseObserverProxy::RCTImageResponseObserverProxy(id<RCTImageResponseDelegate> delegate)
    : delegate_(delegate)
{
}

void RCTImageResponseObserverProxy::didReceiveImage(const ImageResponse &imageResponse) const
{
  UIImage *image = (UIImage *)unwrapManagedObject(imageResponse.getImage());
  id metadata = unwrapManagedObject(imageResponse.getMetadata());
  id<RCTImageResponseDelegate> delegate = delegate_;
  auto this_ = this;
  RCTExecuteOnMainQueue(^{
    [delegate didReceiveImage:image metadata:metadata fromObserver:this_];
  });
}

void RCTImageResponseObserverProxy::didReceiveProgress(float progress, int64_t loaded, int64_t total) const
{
  auto this_ = this;
  id<RCTImageResponseDelegate> delegate = delegate_;
  RCTExecuteOnMainQueue(^{
    [delegate didReceiveProgress:progress loaded:loaded total:total fromObserver:this_];
  });
}

void RCTImageResponseObserverProxy::didReceiveFailure(const ImageLoadError &errorResponse) const
{
  auto this_ = this;
  NSError *error = (NSError *)unwrapManagedObject(errorResponse.getError());
  id<RCTImageResponseDelegate> delegate = delegate_;
  RCTExecuteOnMainQueue(^{
    [delegate didReceiveFailure:error fromObserver:this_];
  });
}

} // namespace facebook::react
