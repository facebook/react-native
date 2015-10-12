/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageLoader.h"

#import <UIKit/UIKit.h>

#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTImageDownloader.h"
#import "RCTImageUtils.h"
#import "RCTLog.h"
#import "RCTUtils.h"

static void RCTDispatchCallbackOnMainQueue(void (^callback)(NSError *, id), NSError *error, UIImage *image)
{
  if ([NSThread isMainThread]) {
    callback(error, image);
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      callback(error, image);
    });
  }
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

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

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

- (id<RCTImageURLLoader>)imageURLLoaderForRequest:(NSURL *)requestURL
{
  NSMutableArray *handlers = [NSMutableArray array];
  for (id<RCTBridgeModule> module in _bridge.modules.allValues) {
    if ([module conformsToProtocol:@protocol(RCTImageURLLoader)]) {
      if ([(id<RCTImageURLLoader>)module canLoadImageURL:requestURL]) {
        [handlers addObject:module];
      }
    }
  }
  [handlers sortUsingComparator:^NSComparisonResult(id<RCTImageURLLoader> a, id<RCTImageURLLoader> b) {
    float priorityA = [a respondsToSelector:@selector(imageLoaderPriority)] ? [a imageLoaderPriority] : 0;
    float priorityB = [b respondsToSelector:@selector(imageLoaderPriority)] ? [b imageLoaderPriority] : 0;
    if (priorityA < priorityB) {
      return NSOrderedAscending;
    } else if (priorityA > priorityB) {
      return NSOrderedDescending;
    } else {
      RCTLogError(@"The RCTImageLoader %@ and %@ both reported that they can"
                  " handle the load request %@, and have equal priority (%g)."
                  " This could result in non-deterministic behavior.",
                  a, b, requestURL, priorityA);

      return NSOrderedSame;
    }
  }];
  return [handlers lastObject];
}

- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(UIViewContentMode)resizeMode
                                      progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  if (imageTag.length == 0) {
    RCTLogWarn(@"source.uri should not be an empty string <Native>");
    return ^{};
  }

  NSURL *requestURL = [RCTConvert NSURL:imageTag];
  id<RCTImageURLLoader> loadHandler = [self imageURLLoaderForRequest:requestURL];
  if (!loadHandler) {
    RCTLogError(@"No suitable image URL loader found for %@", imageTag);
    return ^{};
  }

  return [loadHandler loadImageForURL:requestURL size:size scale:scale resizeMode:resizeMode progressHandler:^(int64_t progress, int64_t total) {
    if (!progressBlock) {
      return;
    }

    if ([NSThread isMainThread]) {
      progressBlock(progress, total);
    } else {
      dispatch_async(dispatch_get_main_queue(), ^{
        progressBlock(progress, total);
      });
    }
  } completionHandler:^(NSError *error, UIImage *image) {
    RCTDispatchCallbackOnMainQueue(completionBlock, error, image);
  }];
}

- (id<RCTImageDecoder>)imageDecoderForRequest:(NSData *)imageData
{
  NSMutableArray *handlers = [NSMutableArray array];
  for (id<RCTBridgeModule> module in _bridge.modules.allValues) {
    if ([module conformsToProtocol:@protocol(RCTImageDecoder)]) {
      if ([(id<RCTImageDecoder>)module canDecodeImageData:imageData]) {
        [handlers addObject:module];
      }
    }
  }
  [handlers sortUsingComparator:^NSComparisonResult(id<RCTImageDecoder> a, id<RCTImageDecoder> b) {
    float priorityA = [a respondsToSelector:@selector(imageDecoderPriority)] ? [a imageDecoderPriority] : 0;
    float priorityB = [b respondsToSelector:@selector(imageDecoderPriority)] ? [b imageDecoderPriority] : 0;
    if (priorityA < priorityB) {
      return NSOrderedAscending;
    } else if (priorityA > priorityB) {
      return NSOrderedDescending;
    } else {
      RCTLogError(@"The RCTImageDecoder %@ and %@ both reported that they can"
                  " handle the decode request <NSData %p; %tu bytes>, and have"
                  " equal priority (%g). This could result in"
                  " non-deterministic behavior.",
                  a, b, imageData, imageData.length, priorityA);

      return NSOrderedSame;
    }
  }];
  return [handlers lastObject];
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(UIViewContentMode)resizeMode
                                   completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  id<RCTImageDecoder> imageDecoder = [self imageDecoderForRequest:data];
  if (imageDecoder) {
    return [imageDecoder decodeImageData:data size:size scale:scale resizeMode:resizeMode completionHandler:^(NSError *error, UIImage *image) {
      RCTDispatchCallbackOnMainQueue(completionBlock, error, image);
    }];
  } else {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *image = [UIImage imageWithData:data scale:scale];
      if (image) {
        RCTDispatchCallbackOnMainQueue(completionBlock, nil, image);
      } else {
        NSString *errorMessage = [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
        NSError *finalError = RCTErrorWithMessage(errorMessage);
        RCTDispatchCallbackOnMainQueue(completionBlock, finalError, nil);
      }
    });
    return ^{};
  }
}

#pragma mark - RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  id<RCTImageURLLoader> handler = [self imageURLLoaderForRequest:request.URL];

  // RCTImageDownloader is an image plugin that uses the networking stack.
  // We don't want to route any network calls through the image downloader
  // as that would cause cyclical dependencies.
  return handler && ![handler isKindOfClass:[RCTImageDownloader class]];
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  __block RCTImageLoaderCancellationBlock requestToken;
  requestToken = [self.bridge.imageLoader loadImageWithTag:request.URL.absoluteString callback:^(NSError *error, UIImage *image) {
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
