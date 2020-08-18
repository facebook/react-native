/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageLoader.h>

typedef BOOL (^RCTImageURLLoaderCanLoadImageURLHandler)(NSURL *requestURL);
typedef RCTImageLoaderCancellationBlock (^RCTImageURLLoaderLoadImageURLHandler)(NSURL *imageURL, CGSize size, CGFloat scale, RCTResizeMode resizeMode, RCTImageLoaderProgressBlock progressHandler, RCTImageLoaderCompletionBlock completionHandler);

@interface RCTConcreteImageURLLoader : NSObject <RCTImageURLLoader>

- (instancetype)initWithPriority:(float)priority
          canLoadImageURLHandler:(RCTImageURLLoaderCanLoadImageURLHandler)canLoadImageURLHandler
             loadImageURLHandler:(RCTImageURLLoaderLoadImageURLHandler)loadImageURLHandler;

@end

typedef BOOL (^RCTImageDataDecoderCanDecodeImageDataHandler)(NSData *imageData);
typedef RCTImageLoaderCancellationBlock (^RCTImageDataDecoderDecodeImageDataHandler)(NSData *imageData, CGSize size, CGFloat scale, RCTResizeMode resizeMode, RCTImageLoaderCompletionBlock completionHandler);

@interface RCTConcreteImageDecoder : NSObject <RCTImageDataDecoder>

- (instancetype)initWithPriority:(float)priority
       canDecodeImageDataHandler:(RCTImageDataDecoderCanDecodeImageDataHandler)canDecodeImageDataHandler
          decodeImageDataHandler:(RCTImageDataDecoderDecodeImageDataHandler)decodeImageDataHandler;

@end

#define _RCTDefineImageHandler(SUPERCLASS, CLASS_NAME) \
@interface CLASS_NAME : SUPERCLASS @end \
@implementation CLASS_NAME RCT_EXPORT_MODULE() @end

#define RCTDefineImageURLLoader(CLASS_NAME) \
_RCTDefineImageHandler(RCTConcreteImageURLLoader, CLASS_NAME)

#define RCTDefineImageDecoder(CLASS_NAME) \
_RCTDefineImageHandler(RCTConcreteImageDecoder, CLASS_NAME)
