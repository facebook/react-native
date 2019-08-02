/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNImageResponseObserverProxy.h"

#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/ImageResponseObserver.h>

namespace facebook {
namespace react {

RNImageResponseObserverProxy::RNImageResponseObserverProxy(void *delegate)
    : delegate_((__bridge id<RNImageResponseDelegate>)delegate)
{
}

void RNImageResponseObserverProxy::didReceiveImage(const ImageResponse &imageResponse)
{
  UIImage *image = (__bridge UIImage *)imageResponse.getImage().get();
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveImage:image fromObserver:this_];
  });
}

void RNImageResponseObserverProxy::didReceiveProgress(float p)
{
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveProgress:p fromObserver:this_];
  });
}

void RNImageResponseObserverProxy::didReceiveFailure()
{
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveFailureFromObserver:this_];
  });
}

} // namespace react
} // namespace facebook
