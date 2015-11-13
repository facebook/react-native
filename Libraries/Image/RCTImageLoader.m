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
  NSURLCache *_cache;
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
  _cache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024 // 5MB
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
      if ([loader canLoadImageURL:URL]) {
        float priority = [loader respondsToSelector:@selector(loaderPriority)] ? [loader loaderPriority] : 0;
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
      if ([decoder canDecodeImageData:data]) {
        float priority = [decoder respondsToSelector:@selector(decoderPriority)] ? [decoder decoderPriority] : 0;
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
  if (imageTag.length == 0) {
    RCTLogWarn(@"source.uri should not be an empty string <Native>");
    return ^{};
  }

  __block volatile uint32_t cancelled = 0;
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

  // Find suitable image URL loader
  NSURLRequest *request = [RCTConvert NSURLRequest:imageTag];
  id<RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:request.URL];
  if (loadHandler) {
    return [loadHandler loadImageForURL:request.URL
                                   size:size
                                  scale:scale
                             resizeMode:resizeMode
                        progressHandler:progressHandler
                      completionHandler:completionHandler] ?: ^{};
  }

  // Check if networking module is available
  if (![_bridge respondsToSelector:@selector(networking)]) {
    RCTLogError(@"No suitable image URL loader found for %@. You may need to "
                " import the RCTNetworking library in order to load images.",
                imageTag);
    return ^{};
  }

  // Use networking module to load image
  if ([_bridge.networking canHandleRequest:request]) {

    __weak RCTImageLoader *weakSelf = self;
    __block RCTImageLoaderCancellationBlock decodeCancel = nil;
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
      decodeCancel = [weakSelf decodeImageData:data
                                          size:size
                                         scale:scale
                                    resizeMode:resizeMode
                               completionBlock:completionHandler];
    };

    // Check for cached response before reloading
    // TODO: move URL cache out of RCTImageLoader into its own module
    NSCachedURLResponse *cachedResponse = [_cache cachedResponseForRequest:request];
    if (cachedResponse) {
      processResponse(cachedResponse.response, cachedResponse.data, nil);
      return ^{};
    }

    // Add missing png extension
    if (request.URL.fileURL && request.URL.pathExtension.length == 0) {
      NSMutableURLRequest *mutableRequest = [request mutableCopy];
      mutableRequest.URL = [NSURL fileURLWithPath:[request.URL.path stringByAppendingPathExtension:@"png"]];
      request = mutableRequest;
    }

    // Download image
    RCTNetworkTask *task = [_bridge.networking networkTaskWithRequest:request completionBlock:
                            ^(NSURLResponse *response, NSData *data, NSError *error) {
      if (error) {
        completionHandler(error, nil);
        return;
      }

      // Cache the response
      // TODO: move URL cache out of RCTImageLoader into its own module
      RCTImageLoader *strongSelf = weakSelf;
      BOOL isHTTPRequest = [request.URL.scheme hasPrefix:@"http"];
      [strongSelf->_cache storeCachedResponse:
       [[NSCachedURLResponse alloc] initWithResponse:response
                                                data:data
                                            userInfo:nil
                                       storagePolicy:isHTTPRequest ? NSURLCacheStorageAllowed: NSURLCacheStorageAllowedInMemoryOnly]
                                   forRequest:request];

      // Process image data
      processResponse(response, data, nil);

    }];
    task.downloadProgressBlock = progressHandler;
    [task start];

    return ^{
      [task cancel];
      if (decodeCancel) {
        decodeCancel();
      }
      OSAtomicOr32Barrier(1, &cancelled);
    };
  }

  RCTLogError(@"No suitable image URL loader found for %@", imageTag);
  return ^{};
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(UIViewContentMode)resizeMode
                                   completionBlock:(RCTImageLoaderCompletionBlock)completionHandler
{
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
      UIImage *image = [UIImage imageWithData:data scale:scale];
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
