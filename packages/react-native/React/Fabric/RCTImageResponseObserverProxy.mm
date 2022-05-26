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

namespace facebook {
namespace react {

RCTImageResponseObserverProxy::RCTImageResponseObserverProxy(id<RCTImageResponseDelegate> delegate)
    : delegate_(delegate)
{
}

void RCTImageResponseObserverProxy::didReceiveImage(ImageResponse const &imageResponse) const
{
  UIImage *image = (UIImage *)unwrapManagedObject(imageResponse.getImage());
  id metadata = unwrapManagedObject(imageResponse.getMetadata());
  id<RCTImageResponseDelegate> delegate = delegate_;
  auto this_ = this;
  RCTExecuteOnMainQueue(^{
    [delegate didReceiveImage:image metadata:metadata fromObserver:this_];
  });
}

void RCTImageResponseObserverProxy::didReceiveProgress(float progress) const
{
  auto this_ = this;
  id<RCTImageResponseDelegate> delegate = delegate_;
  RCTExecuteOnMainQueue(^{
    [delegate didReceiveProgress:progress fromObserver:this_];
  });
}

void RCTImageResponseObserverProxy::didReceiveFailure() const
{
  auto this_ = this;
  id<RCTImageResponseDelegate> delegate = delegate_;
  RCTExecuteOnMainQueue(^{
    [delegate didReceiveFailureFromObserver:this_];
  });
}

} // namespace react
} // namespace facebook
