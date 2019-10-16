/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageResponseObserverProxy.h"

#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/ImageResponseObserver.h>
#import <react/utils/ManagedObjectWrapper.h>

namespace facebook {
namespace react {

RCTImageResponseObserverProxy::RCTImageResponseObserverProxy(id<RCTImageResponseDelegate> delegate)
    : delegate_(delegate)
{
}

void RCTImageResponseObserverProxy::didReceiveImage(ImageResponse const &imageResponse) const
{
  UIImage *image = (UIImage *)unwrapManagedObject(imageResponse.getImage());
  id<RCTImageResponseDelegate> delegate = delegate_;
  auto this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveImage:image fromObserver:this_];
  });
}

void RCTImageResponseObserverProxy::didReceiveProgress(float progress) const
{
  auto this_ = this;
  id<RCTImageResponseDelegate> delegate = delegate_;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveProgress:progress fromObserver:this_];
  });
}

void RCTImageResponseObserverProxy::didReceiveFailure() const
{
  auto this_ = this;
  id<RCTImageResponseDelegate> delegate = delegate_;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveFailureFromObserver:this_];
  });
}

} // namespace react
} // namespace facebook
