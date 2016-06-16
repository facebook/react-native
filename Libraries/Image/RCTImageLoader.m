/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageLoader.h"

#import <libkern/OSAtomic.h>
#import <UIKit/UIKit.h>
#import <ImageIO/ImageIO.h>

#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTImageUtils.h"
#import "RCTLog.h"
#import "RCTNetworking.h"
#import "RCTUtils.h"

static const NSUInteger RCTMaxCachableDecodedImageSizeInBytes = 1048576; // 1MB

static NSString *RCTCacheKeyForImage(NSString *imageTag, CGSize size,
                                     CGFloat scale, RCTResizeMode resizeMode)
{
  return [NSString stringWithFormat:@"%@|%g|%g|%g|%zd",
          imageTag, size.width, size.height, scale, resizeMode];
}

@implementation UIImage (React)

- (CAKeyframeAnimation *)reactKeyframeAnimation
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactKeyframeAnimation:(CAKeyframeAnimation *)reactKeyframeAnimation
{
  objc_setAssociatedObject(self, @selector(reactKeyframeAnimation), reactKeyframeAnimation, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@implementation RCTImageLoader
{
  NSArray<id<RCTImageURLLoader>> *_loaders;
  NSArray<id<RCTImageDataDecoder>> *_decoders;
  NSOperationQueue *_imageDecodeQueue;
  dispatch_queue_t _URLCacheQueue;
  NSURLCache *_URLCache;
  NSCache *_decodedImageCache;
  NSMutableArray *_pendingTasks;
  NSInteger _activeTasks;
  NSMutableArray *_pendingDecodes;
  NSInteger _scheduledDecodes;
  NSUInteger _activeBytes;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (void)setUp
{
  // Set defaults
  _maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks ?: 4;
  _maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks ?: 2;
  _maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes ?: 30 * 1024 * 1024; // 30MB

  _URLCacheQueue = dispatch_queue_create("com.facebook.react.ImageLoaderURLCacheQueue", DISPATCH_QUEUE_SERIAL);

  _decodedImageCache = [NSCache new];
  _decodedImageCache.totalCostLimit = 5 * 1024 * 1024; // 5MB

  // Clear cache in the event of a memory warning, or if app enters background
  [[NSNotificationCenter defaultCenter] addObserver:_decodedImageCache selector:@selector(removeAllObjects) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:_decodedImageCache selector:@selector(removeAllObjects) name:UIApplicationWillResignActiveNotification object:nil];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:_decodedImageCache];
}

- (id<RCTImageURLLoader>)imageURLLoaderForURL:(NSURL *)URL
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_loaders) {
    // Get loaders, sorted in reverse priority order (highest priority first)
    RCTAssert(_bridge, @"Bridge not set");
    _loaders = [[_bridge modulesConformingToProtocol:@protocol(RCTImageURLLoader)] sortedArrayUsingComparator:^NSComparisonResult(id<RCTImageURLLoader> a, id<RCTImageURLLoader> b) {
      float priorityA = [a respondsToSelector:@selector(loaderPriority)] ? [a loaderPriority] : 0;
      float priorityB = [b respondsToSelector:@selector(loaderPriority)] ? [b loaderPriority] : 0;
      if (priorityA > priorityB) {
        return NSOrderedAscending;
      } else if (priorityA < priorityB) {
        return NSOrderedDescending;
      } else {
        return NSOrderedSame;
      }
    }];
  }

  if (RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<RCTImageURLLoader> previousLoader = nil;
    for (id<RCTImageURLLoader> loader in _loaders) {
      float priority = [loader respondsToSelector:@selector(loaderPriority)] ? [loader loaderPriority] : 0;
      if (previousLoader && priority < previousPriority) {
        return previousLoader;
      }
      if ([loader canLoadImageURL:URL]) {
        if (previousLoader) {
          if (priority == previousPriority) {
            RCTLogError(@"The RCTImageURLLoaders %@ and %@ both reported that"
                        " they can load the URL %@, and have equal priority"
                        " (%g). This could result in non-deterministic behavior.",
                        loader, previousLoader, URL, priority);
          }
        } else {
          previousLoader = loader;
          previousPriority = priority;
        }
      }
    }
    return previousLoader;
  }

  // Normal code path
  for (id<RCTImageURLLoader> loader in _loaders) {
    if ([loader canLoadImageURL:URL]) {
      return loader;
    }
  }
  return nil;
}

- (id<RCTImageDataDecoder>)imageDataDecoderForData:(NSData *)data
{
  if (!_maxConcurrentLoadingTasks) {
    [self setUp];
  }

  if (!_decoders) {
    // Get decoders, sorted in reverse priority order (highest priority first)
    RCTAssert(_bridge, @"Bridge not set");
    _decoders = [[_bridge modulesConformingToProtocol:@protocol(RCTImageDataDecoder)] sortedArrayUsingComparator:^NSComparisonResult(id<RCTImageDataDecoder> a, id<RCTImageDataDecoder> b) {
      float priorityA = [a respondsToSelector:@selector(decoderPriority)] ? [a decoderPriority] : 0;
      float priorityB = [b respondsToSelector:@selector(decoderPriority)] ? [b decoderPriority] : 0;
      if (priorityA > priorityB) {
        return NSOrderedAscending;
      } else if (priorityA < priorityB) {
        return NSOrderedDescending;
      } else {
        return NSOrderedSame;
      }
    }];
  }

  if (RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<RCTImageDataDecoder> previousDecoder = nil;
    for (id<RCTImageDataDecoder> decoder in _decoders) {
      float priority = [decoder respondsToSelector:@selector(decoderPriority)] ? [decoder decoderPriority] : 0;
      if (previousDecoder && priority < previousPriority) {
        return previousDecoder;
      }
      if ([decoder canDecodeImageData:data]) {
        if (previousDecoder) {
          if (priority == previousPriority) {
            RCTLogError(@"The RCTImageDataDecoders %@ and %@ both reported that"
                        " they can decode the data <NSData %p; %tu bytes>, and"
                        " have equal priority (%g). This could result in"
                        " non-deterministic behavior.",
                        decoder, previousDecoder, data, data.length, priority);
          }
        } else {
          previousDecoder = decoder;
          previousPriority = priority;
        }
      }
    }
    return previousDecoder;
  }

  // Normal code path
  for (id<RCTImageDataDecoder> decoder in _decoders) {
    if ([decoder canDecodeImageData:data]) {
      return decoder;
    }
  }
  return nil;
}

static UIImage *RCTResizeImageIfNeeded(UIImage *image,
                                       CGSize size,
                                       CGFloat scale,
                                       RCTResizeMode resizeMode)
{
  if (CGSizeEqualToSize(size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, size)) {
    return image;
  }
  CAKeyframeAnimation *animation = image.reactKeyframeAnimation;
  CGRect targetSize = RCTTargetRect(image.size, size, scale, resizeMode);
  CGAffineTransform transform = RCTTransformFromTargetRect(image.size, targetSize);
  image = RCTTransformImage(image, size, scale, transform);
  image.reactKeyframeAnimation = animation;
  return image;
}

- (RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                           callback:(RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithURLRequest:imageURLRequest
                                  size:CGSizeZero
                                 scale:1
                               clipped:YES
                            resizeMode:RCTResizeModeStretch
                         progressBlock:nil
                       completionBlock:callback];
}

- (void)dequeueTasks
{
  dispatch_async(_URLCacheQueue, ^{

    // Remove completed tasks
    for (RCTNetworkTask *task in _pendingTasks.reverseObjectEnumerator) {
      switch (task.status) {
        case RCTNetworkTaskFinished:
          [_pendingTasks removeObject:task];
          _activeTasks--;
          break;
        case RCTNetworkTaskPending:
          break;
        case RCTNetworkTaskInProgress:
          // Check task isn't "stuck"
          if (task.requestToken == nil) {
            RCTLogWarn(@"Task orphaned for request %@", task.request);
            [_pendingTasks removeObject:task];
            _activeTasks--;
            [task cancel];
          }
          break;
      }
    }

    // Start queued decode
    NSInteger activeDecodes = _scheduledDecodes - _pendingDecodes.count;
    while (activeDecodes == 0 || (_activeBytes <= _maxConcurrentDecodingBytes &&
                                  activeDecodes <= _maxConcurrentDecodingTasks)) {
      dispatch_block_t decodeBlock = _pendingDecodes.firstObject;
      if (decodeBlock) {
        [_pendingDecodes removeObjectAtIndex:0];
        decodeBlock();
      } else {
        break;
      }
    }

    // Start queued tasks
    for (RCTNetworkTask *task in _pendingTasks) {
      if (MAX(_activeTasks, _scheduledDecodes) >= _maxConcurrentLoadingTasks) {
        break;
      }
      if (task.status == RCTNetworkTaskPending) {
        [task start];
        _activeTasks++;
      }
    }
  });
}

/**
 * This returns either an image, or raw image data, depending on the loading
 * path taken. This is useful if you want to skip decoding, e.g. when preloading
 * the image, or retrieving metadata.
 */
- (RCTImageLoaderCancellationBlock)loadImageOrDataWithURLRequest:(NSURLRequest *)imageURLRequest
                                                            size:(CGSize)size
                                                           scale:(CGFloat)scale
                                                      resizeMode:(RCTResizeMode)resizeMode
                                                   progressBlock:(RCTImageLoaderProgressBlock)progressHandler
                                                 completionBlock:(void (^)(NSError *error, id imageOrData))completionBlock
{
  __block volatile uint32_t cancelled = 0;
  __block void(^cancelLoad)(void) = nil;
  __weak RCTImageLoader *weakSelf = self;

  void (^completionHandler)(NSError *error, id imageOrData) = ^(NSError *error, id imageOrData) {
    if (RCTIsMainQueue()) {

      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!cancelled) {
          completionBlock(error, imageOrData);
        }
      });
    } else if (!cancelled) {
      completionBlock(error, imageOrData);
    }
  };

  // All access to URL cache must be serialized
  if (!_URLCacheQueue) {
    [self setUp];
  }
  dispatch_async(_URLCacheQueue, ^{

    if (!_URLCache) {
      _URLCache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024 // 5MB
                                                diskCapacity:200 * 1024 * 1024 // 200MB
                                                    diskPath:@"React/RCTImageDownloader"];
    }

    RCTImageLoader *strongSelf = weakSelf;
    if (cancelled || !strongSelf) {
      return;
    }

    // Find suitable image URL loader
    NSURLRequest *request = imageURLRequest; // Use a local variable so we can reassign it in this block
    id<RCTImageURLLoader> loadHandler = [strongSelf imageURLLoaderForURL:request.URL];
    if (loadHandler) {
      cancelLoad = [loadHandler loadImageForURL:request.URL
                                           size:size
                                          scale:scale
                                     resizeMode:resizeMode
                                progressHandler:progressHandler
                              completionHandler:completionHandler] ?: ^{};
      return;
    }

    // Check if networking module is available
    if (RCT_DEBUG && ![_bridge respondsToSelector:@selector(networking)]) {
      RCTLogError(@"No suitable image URL loader found for %@. You may need to "
                  " import the RCTNetwork library in order to load images.",
                  request.URL.absoluteString);
      return;
    }

    // Check if networking module can load image
    if (RCT_DEBUG && ![_bridge.networking canHandleRequest:request]) {
      RCTLogError(@"No suitable image URL loader found for %@", request.URL.absoluteString);
      return;
    }

    // Use networking module to load image
    RCTURLRequestCompletionBlock processResponse =
    ^(NSURLResponse *response, NSData *data, NSError *error) {

      // Check for system errors
      if (error) {
        completionHandler(error, nil);
        return;
      } else if (!data) {
        completionHandler(RCTErrorWithMessage(@"Unknown image download error"), nil);
        return;
      }

      // Check for http errors
      if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
        NSInteger statusCode = ((NSHTTPURLResponse *)response).statusCode;
        if (statusCode != 200) {
          completionHandler([[NSError alloc] initWithDomain:NSURLErrorDomain
                                                       code:statusCode
                                                   userInfo:nil], nil);
          return;
        }
      }

      // Call handler
      completionHandler(nil, data);
    };

    // Add missing png extension
    if (request.URL.fileURL && request.URL.pathExtension.length == 0) {
      NSMutableURLRequest *mutableRequest = [request mutableCopy];
      mutableRequest.URL = [NSURL fileURLWithPath:[request.URL.path stringByAppendingPathExtension:@"png"]];
      request = mutableRequest;
    }

    // Check for cached response before reloading
    // TODO: move URL cache out of RCTImageLoader into its own module
    NSCachedURLResponse *cachedResponse = [_URLCache cachedResponseForRequest:request];

    while (cachedResponse) {
      if ([cachedResponse.response isKindOfClass:[NSHTTPURLResponse class]]) {
        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)cachedResponse.response;
        if (httpResponse.statusCode == 301 || httpResponse.statusCode == 302) {
          NSString *location = httpResponse.allHeaderFields[@"Location"];
          if (location == nil) {
            completionHandler(RCTErrorWithMessage(@"Image redirect without location"), nil);
            return;
          }

          NSURL *redirectURL = [NSURL URLWithString: location relativeToURL: request.URL];
          request = [NSURLRequest requestWithURL:redirectURL];
          cachedResponse = [_URLCache cachedResponseForRequest:request];
          continue;
        }
      }

      processResponse(cachedResponse.response, cachedResponse.data, nil);
      return;
    }

    // Download image
    RCTNetworkTask *task = [_bridge.networking networkTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
      if (error) {
        completionHandler(error, nil);
        [weakSelf dequeueTasks];
        return;
      }

      dispatch_async(_URLCacheQueue, ^{

        // Cache the response
        // TODO: move URL cache out of RCTImageLoader into its own module
        BOOL isHTTPRequest = [request.URL.scheme hasPrefix:@"http"];
        [strongSelf->_URLCache storeCachedResponse:
         [[NSCachedURLResponse alloc] initWithResponse:response
                                                  data:data
                                              userInfo:nil
                                         storagePolicy:isHTTPRequest ? NSURLCacheStorageAllowed: NSURLCacheStorageAllowedInMemoryOnly]
                                        forRequest:request];
        // Process image data
        processResponse(response, data, nil);

        // Prepare for next task
        [weakSelf dequeueTasks];

      });

    }];
    task.downloadProgressBlock = progressHandler;

    if (!_pendingTasks) {
      _pendingTasks = [NSMutableArray new];
    }
    if (task) {
      [_pendingTasks addObject:task];
      [weakSelf dequeueTasks];
    }

    cancelLoad = ^{
      [task cancel];
      [weakSelf dequeueTasks];
    };

  });

  return ^{
    if (cancelLoad) {
      cancelLoad();
    }
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

- (RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                      size:(CGSize)size
                                                     scale:(CGFloat)scale
                                                   clipped:(BOOL)clipped
                                                resizeMode:(RCTResizeMode)resizeMode
                                             progressBlock:(RCTImageLoaderProgressBlock)progressHandler
                                           completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  __block volatile uint32_t cancelled = 0;
  __block void(^cancelLoad)(void) = nil;
  __weak RCTImageLoader *weakSelf = self;

  // Check decoded image cache
  NSString *cacheKey = RCTCacheKeyForImage(imageURLRequest.URL.absoluteString, size, scale, resizeMode);
  {
    UIImage *image = [_decodedImageCache objectForKey:cacheKey];
    if (image) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        completionBlock(nil, image);
      });
      return ^{};
    }
  }

  RCTImageLoaderCompletionBlock cacheResultHandler = ^(NSError *error, UIImage *image) {
    if (image) {
      CGFloat bytes = image.size.width * image.size.height * image.scale * image.scale * 4;
      if (bytes <= RCTMaxCachableDecodedImageSizeInBytes) {
        [_decodedImageCache setObject:image forKey:cacheKey cost:bytes];
      }
    }
    completionBlock(error, image);
  };

  void (^completionHandler)(NSError *, id) = ^(NSError *error, id imageOrData) {
    if (!cancelled) {
      if (!imageOrData || [imageOrData isKindOfClass:[UIImage class]]) {
        cacheResultHandler(error, imageOrData);
      } else {
        cancelLoad = [weakSelf decodeImageData:imageOrData
                                          size:size
                                         scale:scale
                                       clipped:clipped
                                    resizeMode:resizeMode
                               completionBlock:cacheResultHandler];
      }
    }
  };

  cancelLoad = [self loadImageOrDataWithURLRequest:imageURLRequest
                                       size:size
                                      scale:scale
                                 resizeMode:resizeMode
                              progressBlock:progressHandler
                            completionBlock:completionHandler];
  return ^{
    if (cancelLoad) {
      cancelLoad();
    }
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                           clipped:(BOOL)clipped
                                        resizeMode:(RCTResizeMode)resizeMode
                                   completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  if (data.length == 0) {
    completionBlock(RCTErrorWithMessage(@"No image data"), nil);
    return ^{};
  }

  __block volatile uint32_t cancelled = 0;
  void (^completionHandler)(NSError *, UIImage *) = ^(NSError *error, UIImage *image) {
    if (RCTIsMainQueue()) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!cancelled) {
          completionBlock(error, clipped ? RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
        }
      });
    } else if (!cancelled) {
      completionBlock(error, clipped ? RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
    }
  };

  id<RCTImageDataDecoder> imageDecoder = [self imageDataDecoderForData:data];
  if (imageDecoder) {
    return [imageDecoder decodeImageData:data
                                    size:size
                                   scale:scale
                              resizeMode:resizeMode
                       completionHandler:completionHandler] ?: ^{};
  } else {

    if (!_URLCacheQueue) {
      [self setUp];
    }
    dispatch_async(_URLCacheQueue, ^{
      dispatch_block_t decodeBlock = ^{

        // Calculate the size, in bytes, that the decompressed image will require
        NSInteger decodedImageBytes = (size.width * scale) * (size.height * scale) * 4;

        // Mark these bytes as in-use
        _activeBytes += decodedImageBytes;

        // Do actual decompression on a concurrent background queue
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          if (!cancelled) {

            // Decompress the image data (this may be CPU and memory intensive)
            UIImage *image = RCTDecodeImageWithData(data, size, scale, resizeMode);

#if RCT_DEV

            CGSize imagePixelSize = RCTSizeInPixels(image.size, image.scale);
            CGSize screenPixelSize = RCTSizeInPixels(RCTScreenSize(), RCTScreenScale());
            if (imagePixelSize.width * imagePixelSize.height >
                screenPixelSize.width * screenPixelSize.height) {
              RCTLogInfo(@"[PERF ASSETS] Loading image at size %@, which is larger "
                         "than the screen size %@", NSStringFromCGSize(imagePixelSize),
                         NSStringFromCGSize(screenPixelSize));
            }

#endif

            if (image) {
              completionHandler(nil, image);
            } else {
              NSString *errorMessage = [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
              NSError *finalError = RCTErrorWithMessage(errorMessage);
              completionHandler(finalError, nil);
            }
          }

          // We're no longer retaining the uncompressed data, so now we'll mark
          // the decoding as complete so that the loading task queue can resume.
          dispatch_async(_URLCacheQueue, ^{
            _scheduledDecodes--;
            _activeBytes -= decodedImageBytes;
            [self dequeueTasks];
          });
        });
      };

      // The decode operation retains the compressed image data until it's
      // complete, so we'll mark it as having started, in order to block
      // further image loads from happening until we're done with the data.
      _scheduledDecodes++;

      if (!_pendingDecodes) {
        _pendingDecodes = [NSMutableArray new];
      }
      NSInteger activeDecodes = _scheduledDecodes - _pendingDecodes.count - 1;
      if (activeDecodes == 0 || (_activeBytes <= _maxConcurrentDecodingBytes &&
                                 activeDecodes <= _maxConcurrentDecodingTasks)) {
        decodeBlock();
      } else {
        [_pendingDecodes addObject:decodeBlock];
      }

    });

    return ^{
      OSAtomicOr32Barrier(1, &cancelled);
    };
  }
}

- (RCTImageLoaderCancellationBlock)getImageSizeForURLRequest:(NSURLRequest *)imageURLRequest
                                          block:(void(^)(NSError *error, CGSize size))completionBlock
{
  return [self loadImageOrDataWithURLRequest:imageURLRequest
                                 size:CGSizeZero
                                scale:1
                           resizeMode:RCTResizeModeStretch
                        progressBlock:nil
                      completionBlock:^(NSError *error, id imageOrData) {
                        CGSize size;
                        if ([imageOrData isKindOfClass:[NSData class]]) {
                          NSDictionary *meta = RCTGetImageMetadata(imageOrData);
                          size = (CGSize){
                            [meta[(id)kCGImagePropertyPixelWidth] doubleValue],
                            [meta[(id)kCGImagePropertyPixelHeight] doubleValue],
                          };
                        } else {
                          UIImage *image = imageOrData;
                          size = (CGSize){
                            image.size.width * image.scale,
                            image.size.height * image.scale,
                          };
                        }
                        completionBlock(error, size);
                      }];
}

#pragma mark - RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  NSURL *requestURL = request.URL;
  for (id<RCTImageURLLoader> loader in _loaders) {
    // Don't use RCTImageURLLoader protocol for modules that already conform to
    // RCTURLRequestHandler as it's inefficient to decode an image and then
    // convert it back into data
    if (![loader conformsToProtocol:@protocol(RCTURLRequestHandler)] &&
        [loader canLoadImageURL:requestURL]) {
      return YES;
    }
  }
  return NO;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  __block RCTImageLoaderCancellationBlock requestToken;
  requestToken = [self loadImageWithURLRequest:request callback:^(NSError *error, UIImage *image) {
    if (error) {
      [delegate URLRequest:requestToken didCompleteWithError:error];
      return;
    }

    NSString *mimeType = nil;
    NSData *imageData = nil;
    if (RCTImageHasAlpha(image.CGImage)) {
      mimeType = @"image/png";
      imageData = UIImagePNGRepresentation(image);
    } else {
      mimeType = @"image/jpeg";
      imageData = UIImageJPEGRepresentation(image, 1.0);
    }

    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:mimeType
                                           expectedContentLength:imageData.length
                                                textEncodingName:nil];

    [delegate URLRequest:requestToken didReceiveResponse:response];
    [delegate URLRequest:requestToken didReceiveData:imageData];
    [delegate URLRequest:requestToken didCompleteWithError:nil];
  }];

  return requestToken;
}

- (void)cancelRequest:(id)requestToken
{
  if (requestToken) {
    ((RCTImageLoaderCancellationBlock)requestToken)();
  }
}

@end

@implementation RCTImageLoader (Deprecated)

- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(RCTImageLoaderCompletionBlock)callback
{
  RCTLogWarn(@"[RCTImageLoader loadImageWithTag:callback:] is deprecated. Instead use [RCTImageLoader loadImageWithURLRequest:callback:]");
  return [self loadImageWithURLRequest:[RCTConvert NSURLRequest:imageTag]
                              callback:callback];
}

- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(RCTResizeMode)resizeMode
                                      progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  RCTLogWarn(@"[RCTImageLoader loadImageWithTag:size:scale:resizeMode:progressBlock:completionBlock:] is deprecated. Instead use [RCTImageLoader loadImageWithURLRequest:size:scale:clipped:resizeMode:progressBlock:completionBlock:]");
  return [self loadImageWithURLRequest:[RCTConvert NSURLRequest:imageTag]
                                  size:size
                                 scale:scale
                               clipped:YES
                            resizeMode:resizeMode
                         progressBlock:progressBlock
                       completionBlock:completionBlock];
}

- (RCTImageLoaderCancellationBlock)loadImageWithoutClipping:(NSString *)imageTag
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(RCTResizeMode)resizeMode
                                              progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                            completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  RCTLogWarn(@"[RCTImageLoader loadImageWithoutClipping:size:scale:resizeMode:progressBlock:completionBlock:] is deprecated. Instead use [RCTImageLoader loadImageWithURLRequest:size:scale:clipped:resizeMode:progressBlock:completionBlock:]");
  return [self loadImageWithURLRequest:[RCTConvert NSURLRequest:imageTag]
                                  size:size
                                 scale:scale
                               clipped:NO
                            resizeMode:resizeMode
                         progressBlock:progressBlock
                       completionBlock:completionBlock];
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                   completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  RCTLogWarn(@"[RCTImageLoader decodeImageData:size:scale:resizeMode:completionBlock:] is deprecated. Instead use [RCTImageLoader decodeImageData:size:scale:clipped:resizeMode:completionBlock:]");
  return [self decodeImageData:imageData
                          size:size
                         scale:scale
                       clipped:NO
                    resizeMode:resizeMode
               completionBlock:completionBlock];
}

- (RCTImageLoaderCancellationBlock)decodeImageDataWithoutClipping:(NSData *)imageData
                                                             size:(CGSize)size
                                                            scale:(CGFloat)scale
                                                       resizeMode:(RCTResizeMode)resizeMode
                                                  completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  RCTLogWarn(@"[RCTImageLoader decodeImageDataWithoutClipping:size:scale:resizeMode:completionBlock:] is deprecated. Instead use [RCTImageLoader decodeImageData:size:scale:clipped:resizeMode:completionBlock:]");
  return [self decodeImageData:imageData
                          size:size
                         scale:scale
                       clipped:NO
                    resizeMode:resizeMode
               completionBlock:completionBlock];
}

- (RCTImageLoaderCancellationBlock)getImageSize:(NSString *)imageTag
                                          block:(void(^)(NSError *error, CGSize size))completionBlock
{
  RCTLogWarn(@"[RCTImageLoader getImageSize:block:] is deprecated. Instead use [RCTImageLoader getImageSizeForURLRequest:block:]");
  return [self getImageSizeForURLRequest:[RCTConvert NSURLRequest:imageTag]
                                   block:completionBlock];
}

@end

@implementation RCTBridge (RCTImageLoader)

- (RCTImageLoader *)imageLoader
{
  return [self moduleForClass:[RCTImageLoader class]];
}

@end
