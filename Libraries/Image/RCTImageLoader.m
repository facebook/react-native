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

#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTImageUtils.h"
#import "RCTLog.h"
#import "RCTNetworking.h"
#import "RCTUtils.h"

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
  dispatch_queue_t _URLCacheQueue;
  NSURLCache *_URLCache;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  // Get image loaders and decoders
  NSMutableArray<id<RCTImageURLLoader>> *loaders = [NSMutableArray array];
  NSMutableArray<id<RCTImageDataDecoder>> *decoders = [NSMutableArray array];
  for (id<RCTBridgeModule> module in bridge.modules.allValues) {
    if ([module conformsToProtocol:@protocol(RCTImageURLLoader)]) {
      [loaders addObject:(id<RCTImageURLLoader>)module];
    }
    if ([module conformsToProtocol:@protocol(RCTImageDataDecoder)]) {
      [decoders addObject:(id<RCTImageDataDecoder>)module];
    }
  }

  // Sort loaders in reverse priority order (highest priority first)
  [loaders sortUsingComparator:^NSComparisonResult(id<RCTImageURLLoader> a, id<RCTImageURLLoader> b) {
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

  // Sort decoders in reverse priority order (highest priority first)
  [decoders sortUsingComparator:^NSComparisonResult(id<RCTImageDataDecoder> a, id<RCTImageDataDecoder> b) {
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

  _bridge = bridge;
  _loaders = loaders;
  _decoders = decoders;
  _URLCacheQueue = dispatch_queue_create("com.facebook.react.ImageLoaderURLCacheQueue", DISPATCH_QUEUE_SERIAL);
  _URLCache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024 // 5MB
                                            diskCapacity:200 * 1024 * 1024 // 200MB
                                                diskPath:@"React/RCTImageDownloader"];
}

- (id<RCTImageURLLoader>)imageURLLoaderForURL:(NSURL *)URL
{
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

- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithTag:imageTag
                           size:CGSizeZero
                          scale:1
                     resizeMode:UIViewContentModeScaleToFill
                  progressBlock:nil
                completionBlock:callback];
}

- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(UIViewContentMode)resizeMode
                                      progressBlock:(RCTImageLoaderProgressBlock)progressHandler
                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  __block volatile uint32_t cancelled = 0;
  __block void(^cancelLoad)(void) = nil;
  __weak RCTImageLoader *weakSelf = self;

  RCTImageLoaderCompletionBlock completionHandler = ^(NSError *error, UIImage *image) {
    if ([NSThread isMainThread]) {

      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!cancelled) {
          completionBlock(error, image);
        }
      });
    } else if (!cancelled) {
      completionBlock(error, image);
    }
  };

  if (imageTag.length == 0) {
    completionHandler(RCTErrorWithMessage(@"source.uri should not be an empty string"), nil);
    return ^{};
  }

  // All access to URL cache must be serialized
  dispatch_async(_URLCacheQueue, ^{
    RCTImageLoader *strongSelf = weakSelf;
    if (cancelled || !strongSelf) {
      return;
    }

    // Find suitable image URL loader
    NSURLRequest *request = [RCTConvert NSURLRequest:imageTag];
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
                  " import the RCTNetworking library in order to load images.",
                  imageTag);
      return;
    }

    // Check if networking module can load image
    if (RCT_DEBUG && ![_bridge.networking canHandleRequest:request]) {
      RCTLogError(@"No suitable image URL loader found for %@", imageTag);
      return;
    }

    // Use networking module to load image
    __block RCTImageLoaderCancellationBlock cancelDecode = nil;
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

      // Decode image
      cancelDecode = [strongSelf decodeImageData:data
                                            size:size
                                           scale:scale
                                      resizeMode:resizeMode
                                 completionBlock:completionHandler];
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
    if (cachedResponse) {
      processResponse(cachedResponse.response, cachedResponse.data, nil);
      return;
    }

    // Download image
    RCTNetworkTask *task = [_bridge.networking networkTaskWithRequest:request completionBlock:
                            ^(NSURLResponse *response, NSData *data, NSError *error) {
      if (error) {
        completionHandler(error, nil);
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

      });

    }];
    task.downloadProgressBlock = progressHandler;
    [task start];

    cancelLoad = ^{
      [task cancel];
      if (cancelDecode) {
        cancelDecode();
      }
    };

  });

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
                                        resizeMode:(UIViewContentMode)resizeMode
                                   completionBlock:(RCTImageLoaderCompletionBlock)completionHandler
{
  if (data.length == 0) {
    completionHandler(RCTErrorWithMessage(@"No image data"), nil);
    return ^{};
  }

  id<RCTImageDataDecoder> imageDecoder = [self imageDataDecoderForData:data];
  if (imageDecoder) {

    return [imageDecoder decodeImageData:data
                                    size:size
                                   scale:scale
                              resizeMode:resizeMode
                       completionHandler:completionHandler];
  } else {

    __block volatile uint32_t cancelled = 0;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      if (cancelled) {
        return;
      }
      UIImage *image = RCTDecodeImageWithData(data, size, scale, resizeMode);
      if (image) {
        completionHandler(nil, image);
      } else {
        NSString *errorMessage = [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
        NSError *finalError = RCTErrorWithMessage(errorMessage);
        completionHandler(finalError, nil);
      }
    });

    return ^{
      OSAtomicOr32Barrier(1, &cancelled);
    };
  }
}

#pragma mark - RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  NSURL *requestURL = request.URL;
  for (id<RCTBridgeModule> module in _bridge.modules.allValues) {
    if ([module conformsToProtocol:@protocol(RCTImageURLLoader)] &&
        [(id<RCTImageURLLoader>)module canLoadImageURL:requestURL]) {
      return YES;
    }
  }
  return NO;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  __block RCTImageLoaderCancellationBlock requestToken;
  requestToken = [self loadImageWithTag:request.URL.absoluteString callback:^(NSError *error, UIImage *image) {
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

@implementation RCTBridge (RCTImageLoader)

- (RCTImageLoader *)imageLoader
{
  return self.modules[RCTBridgeModuleNameForClass([RCTImageLoader class])];
}

@end
