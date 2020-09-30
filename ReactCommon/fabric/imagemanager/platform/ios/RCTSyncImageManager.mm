/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSyncImageManager.h"

#import <react/utils/ManagedObjectWrapper.h>
#import <react/utils/SharedFunction.h>

#import <React/RCTAssert.h>
#import <React/RCTImageLoaderWithAttributionProtocol.h>
#import <React/RCTLog.h>
#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/ImageResponseObserver.h>

#import "RCTImagePrimitivesConversions.h"

using namespace facebook::react;

@implementation RCTSyncImageManager {
  id<RCTImageLoaderWithAttributionProtocol> _imageLoader;
}

- (instancetype)initWithImageLoader:(id<RCTImageLoaderWithAttributionProtocol>)imageLoader
{
  if (self = [super init]) {
    RCTAssert(RCTRunningInTestEnvironment(), @"This class is only meant to be used in test environment");
    _imageLoader = imageLoader;
  }

  return self;
}

- (ImageRequest)requestImage:(ImageSource)imageSource surfaceId:(SurfaceId)surfaceId
{
  auto imageRequest = ImageRequest(imageSource, nullptr);
  auto weakObserverCoordinator =
      (std::weak_ptr<const ImageResponseObserverCoordinator>)imageRequest.getSharedObserverCoordinator();

  auto sharedCancelationFunction = SharedFunction<>();
  imageRequest.setCancelationFunction(sharedCancelationFunction);

  dispatch_group_t imageWaitGroup = dispatch_group_create();

  dispatch_group_enter(imageWaitGroup);

  NSURLRequest *request = NSURLRequestFromImageSource(imageSource);

  auto completionBlock = ^(NSError *error, UIImage *image) {
    auto observerCoordinator = weakObserverCoordinator.lock();
    if (!observerCoordinator) {
      return;
    }

    if (image && !error) {
      observerCoordinator->nativeImageResponseComplete(ImageResponse(wrapManagedObject(image)));
    } else {
      observerCoordinator->nativeImageResponseFailed();
    }
    dispatch_group_leave(imageWaitGroup);
  };

  auto progressBlock = ^(int64_t progress, int64_t total) {
    auto observerCoordinator = weakObserverCoordinator.lock();
    if (!observerCoordinator) {
      return;
    }

    observerCoordinator->nativeImageResponseProgress(progress / (float)total);
  };

  RCTImageURLLoaderRequest *loaderRequest =
      [self->_imageLoader loadImageWithURLRequest:request
                                             size:CGSizeMake(imageSource.size.width, imageSource.size.height)
                                            scale:imageSource.scale
                                          clipped:YES
                                       resizeMode:RCTResizeModeStretch
                                      attribution:{
                                                      .surfaceId = surfaceId,
                                                  }
                                    progressBlock:progressBlock
                                 partialLoadBlock:nil
                                  completionBlock:completionBlock];
  RCTImageLoaderCancellationBlock cancelationBlock = loaderRequest.cancellationBlock;
  sharedCancelationFunction.assign([cancelationBlock]() { cancelationBlock(); });

  auto result = dispatch_group_wait(imageWaitGroup, dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC));
  if (result != 0) {
    RCTLogError(@"Getting an image timed out");
  }
  return imageRequest;
}

@end
