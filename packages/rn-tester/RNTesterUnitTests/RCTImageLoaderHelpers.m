/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageLoaderHelpers.h"

@implementation RCTConcreteImageURLLoader
{
  RCTImageURLLoaderCanLoadImageURLHandler _canLoadImageURLHandler;
  RCTImageURLLoaderLoadImageURLHandler _loadImageURLHandler;
  float _priority;
}

+ (NSString *)moduleName
{
  return nil;
}

- (instancetype)init
{
  return nil;
}

- (instancetype)initWithPriority:(float)priority canLoadImageURLHandler:(RCTImageURLLoaderCanLoadImageURLHandler)canLoadImageURLHandler loadImageURLHandler:(RCTImageURLLoaderLoadImageURLHandler)loadImageURLHandler
{
  if ((self = [super init])) {
    _canLoadImageURLHandler = [canLoadImageURLHandler copy];
    _loadImageURLHandler = [loadImageURLHandler copy];
    _priority = priority;
  }

  return self;
}

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return _canLoadImageURLHandler(requestURL);
}

- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(__unused RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  return _loadImageURLHandler(imageURL, size, scale, resizeMode, progressHandler, completionHandler);
}

- (float)loaderPriority
{
  return _priority;
}

@end

@implementation RCTConcreteImageDecoder
{
  RCTImageDataDecoderCanDecodeImageDataHandler _canDecodeImageDataHandler;
  RCTImageDataDecoderDecodeImageDataHandler _decodeImageDataHandler;
  float _priority;
}

+ (NSString *)moduleName
{
  return nil;
}

- (instancetype)init
{
  return nil;
}

- (instancetype)initWithPriority:(float)priority canDecodeImageDataHandler:(RCTImageDataDecoderCanDecodeImageDataHandler)canDecodeImageDataHandler decodeImageDataHandler:(RCTImageDataDecoderDecodeImageDataHandler)decodeImageDataHandler
{
  if ((self = [super init])) {
    _canDecodeImageDataHandler = [canDecodeImageDataHandler copy];
    _decodeImageDataHandler = [decodeImageDataHandler copy];
    _priority = priority;
  }

  return self;
}

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  return _canDecodeImageDataHandler(imageData);
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData size:(CGSize)size scale:(CGFloat)scale resizeMode:(RCTResizeMode)resizeMode completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  return _decodeImageDataHandler(imageData, size, scale, resizeMode, completionHandler);
}

- (float)decoderPriority
{
  return _priority;
}

@end
