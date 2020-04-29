/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageResponseObserverProxy.h"

#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/ImageResponseObserver.h>
<<<<<<< HEAD
=======
#import <react/utils/ManagedObjectWrapper.h>
>>>>>>> fb/0.62-stable

namespace facebook {
namespace react {

<<<<<<< HEAD
RCTImageResponseObserverProxy::RCTImageResponseObserverProxy(void *delegate)
    : delegate_((__bridge id<RCTImageResponseDelegate>)delegate)
{
}

void RCTImageResponseObserverProxy::didReceiveImage(const ImageResponse &imageResponse)
{
  UIImage *image = (__bridge UIImage *)imageResponse.getImage().get();
  void *this_ = this;
=======
RCTImageResponseObserverProxy::RCTImageResponseObserverProxy(id<RCTImageResponseDelegate> delegate)
    : delegate_(delegate)
{
}

void RCTImageResponseObserverProxy::didReceiveImage(ImageResponse const &imageResponse) const
{
  UIImage *image = (UIImage *)unwrapManagedObject(imageResponse.getImage());
  id<RCTImageResponseDelegate> delegate = delegate_;
  auto this_ = this;
>>>>>>> fb/0.62-stable
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveImage:image fromObserver:this_];
  });
}

<<<<<<< HEAD
void RCTImageResponseObserverProxy::didReceiveProgress(float p)
{
  void *this_ = this;
=======
void RCTImageResponseObserverProxy::didReceiveProgress(float progress) const
{
  auto this_ = this;
  id<RCTImageResponseDelegate> delegate = delegate_;
>>>>>>> fb/0.62-stable
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveProgress:progress fromObserver:this_];
  });
}

<<<<<<< HEAD
void RCTImageResponseObserverProxy::didReceiveFailure()
{
  void *this_ = this;
=======
void RCTImageResponseObserverProxy::didReceiveFailure() const
{
  auto this_ = this;
  id<RCTImageResponseDelegate> delegate = delegate_;
>>>>>>> fb/0.62-stable
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveFailureFromObserver:this_];
  });
}

} // namespace react
} // namespace facebook
