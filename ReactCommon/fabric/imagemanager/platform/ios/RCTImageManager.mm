/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageManager.h"

#import <react/debug/SystraceSection.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <react/utils/SharedFunction.h>

#import <React/RCTImageLoaderWithAttributionProtocol.h>

#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/ImageResponseObserver.h>

#import "RCTImageInstrumentationProxy.h"
#import "RCTImagePrimitivesConversions.h"

using namespace facebook::react;

@implementation RCTImageManager {
  id<RCTImageLoaderWithAttributionProtocol> _imageLoader;
  dispatch_queue_t _backgroundSerialQueue;
}

- (instancetype)initWithImageLoader:(id<RCTImageLoaderWithAttributionProtocol>)imageLoader
{
  if (self = [super init]) {
    _imageLoader = imageLoader;
    _backgroundSerialQueue =
        dispatch_queue_create("com.facebook.react-native.image-manager-queue", DISPATCH_QUEUE_SERIAL);
  }

  return self;
}

- (ImageRequest)requestImage:(ImageSource)imageSource surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("RCTImageManager::requestImage");

  auto imageInstrumentation = std::make_shared<RCTImageInstrumentationProxy>(_imageLoader);
  auto imageRequest = ImageRequest(imageSource, imageInstrumentation);
  auto weakObserverCoordinator =
      (std::weak_ptr<const ImageResponseObserverCoordinator>)imageRequest.getSharedObserverCoordinator();

  auto sharedCancelationFunction = SharedFunction<>();
  imageRequest.setCancelationFunction(sharedCancelationFunction);

  /*
   * Even if an image is being loaded asynchronously on some other background thread, some other preparation
   * work (such as creating an `NSURLRequest` object and some obscure logic inside `RCTImageLoader`) can take a couple
   * of milliseconds, so we have to offload this to a separate thread. `ImageRequest` can be created as part of the
   * layout process, so it must be highly performant.
   *
   * Technically, we don't need to dispatch this to *serial* queue. The interface of `RCTImageLoader` promises to be
   * fully thread-safe. However, in reality, it crashes when we request images on concurrently on different threads. See
   * T46024425 for more details.
   */
  dispatch_async(_backgroundSerialQueue, ^{
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

    if (imageInstrumentation) {
      imageInstrumentation->setImageURLLoaderRequest(loaderRequest);
    }
  });

  return imageRequest;
}

@end
