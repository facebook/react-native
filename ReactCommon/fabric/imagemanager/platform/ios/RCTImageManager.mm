/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageManager.h"

#import <folly/futures/Future.h>
#import <folly/futures/Promise.h>

#import <React/RCTImageLoader.h>

#import "RCTImagePrimitivesConversions.h"

using namespace facebook::react;

@implementation RCTImageManager
{
  RCTImageLoader *_imageLoader;
}

- (instancetype)initWithImageLoader:(RCTImageLoader *)imageLoader
{
  if (self = [super init]) {
    _imageLoader = imageLoader;
  }

  return self;
}

- (ImageRequest)requestImage:(const ImageSource &)imageSource
{
  __block auto promise = folly::Promise<ImageResponse>();

  NSURLRequest *request = NSURLRequestFromImageSource(imageSource);

  auto completionBlock = ^(NSError *error, UIImage *image) {
    auto imageResponse = ImageResponse(std::shared_ptr<void>((__bridge_retained void *)image, CFRelease));
    promise.setValue(std::move(imageResponse));
  };

  auto interruptBlock = ^(const folly::exception_wrapper &exceptionWrapper) {
    if (!promise.isFulfilled()) {
      promise.setException(exceptionWrapper);
    }
  };

  RCTImageLoaderCancellationBlock cancellationBlock =
    [_imageLoader loadImageWithURLRequest:request
                                     size:CGSizeMake(imageSource.size.width, imageSource.size.height)
                                    scale:imageSource.scale
                                  clipped:YES
                               resizeMode:RCTResizeModeStretch
                            progressBlock:nil
                         partialLoadBlock:nil
                          completionBlock:completionBlock];

  promise.setInterruptHandler([cancellationBlock, interruptBlock](const folly::exception_wrapper &exceptionWrapper) {
    cancellationBlock();
    interruptBlock(exceptionWrapper);
  });

  return ImageRequest(imageSource, promise.getFuture());
}

@end
