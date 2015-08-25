/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageLoader.h"

#import <AssetsLibrary/AssetsLibrary.h>
#import <Photos/PHAsset.h>
#import <Photos/PHFetchResult.h>
#import <Photos/PHImageManager.h>
#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTGIFImage.h"
#import "RCTImageDownloader.h"
#import "RCTImageStoreManager.h"
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

static dispatch_queue_t RCTImageLoaderQueue(void)
{
  static dispatch_queue_t queue = NULL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.rctImageLoader", DISPATCH_QUEUE_SERIAL);
  });

  return queue;
}

@implementation RCTImageLoader
{
  ALAssetsLibrary *_assetsLibrary;
}

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

// Why use a custom scaling method? Greater efficiency, reduced memory overhead:
// http://www.mindsea.com/2012/12/downscaling-huge-alassets-without-fear-of-sigkill

static UIImage *RCTScaledImageForAsset(ALAssetRepresentation *representation,
                                       CGSize size, CGFloat scale,
                                       UIViewContentMode resizeMode,
                                       NSError **error)
{
  NSUInteger length = (NSUInteger)representation.size;
  NSMutableData *data = [NSMutableData dataWithLength:length];
  if (![representation getBytes:data.mutableBytes
                     fromOffset:0
                         length:length
                          error:error]) {
    return nil;
  }

  CGSize sourceSize = representation.dimensions;
  CGSize targetSize = RCTTargetSize(sourceSize, representation.scale,
                                    size, scale, resizeMode, NO);

  NSDictionary *options = @{
    (id)kCGImageSourceShouldAllowFloat: @YES,
    (id)kCGImageSourceCreateThumbnailWithTransform: @YES,
    (id)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
    (id)kCGImageSourceThumbnailMaxPixelSize: @(MAX(targetSize.width, targetSize.height) * scale)
  };

  CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)data, nil);
  CGImageRef imageRef = CGImageSourceCreateThumbnailAtIndex(sourceRef, 0, (__bridge CFDictionaryRef)options);
  if (sourceRef) {
    CFRelease(sourceRef);
  }

  if (imageRef) {
    UIImage *image = [UIImage imageWithCGImage:imageRef scale:scale
                                   orientation:UIImageOrientationUp];
    CGImageRelease(imageRef);
    return image;
  }

  return nil;
}

- (ALAssetsLibrary *)assetsLibrary
{
  if (!_assetsLibrary) {
    _assetsLibrary = [ALAssetsLibrary new];
  }
  return _assetsLibrary;
}

- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(UIViewContentMode)resizeMode
                                      progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  if ([imageTag hasPrefix:@"assets-library://"]) {
    [[self assetsLibrary] assetForURL:[RCTConvert NSURL:imageTag] resultBlock:^(ALAsset *asset) {
      if (asset) {
        // ALAssetLibrary API is async and will be multi-threaded. Loading a few full
        // resolution images at once will spike the memory up to store the image data,
        // and might trigger memory warnings and/or OOM crashes.
        // To improve this, process the loaded asset in a serial queue.
        dispatch_async(RCTImageLoaderQueue(), ^{
          // Also make sure the image is released immediately after it's used so it
          // doesn't spike the memory up during the process.
          @autoreleasepool {

            BOOL useMaximumSize = CGSizeEqualToSize(size, CGSizeZero);
            ALAssetRepresentation *representation = [asset defaultRepresentation];

            UIImage *image;
            NSError *error = nil;
            if (useMaximumSize) {
              image = [UIImage imageWithCGImage:representation.fullResolutionImage
                                          scale:scale
                                    orientation:(UIImageOrientation)representation.orientation];
            } else {
              image = RCTScaledImageForAsset(representation, size, scale, resizeMode, &error);
            }

            RCTDispatchCallbackOnMainQueue(completionBlock, error, image);
          }
        });
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@ with no error message.", imageTag];
        NSError *error = RCTErrorWithMessage(errorText);
        RCTDispatchCallbackOnMainQueue(completionBlock, error, nil);
      }
    } failureBlock:^(NSError *loadError) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@.\niOS Error: %@", imageTag, loadError];
      NSError *error = RCTErrorWithMessage(errorText);
      RCTDispatchCallbackOnMainQueue(completionBlock, error, nil);
    }];
    return ^{};
  } else if ([imageTag hasPrefix:@"ph://"]) {
    // Using PhotoKit for iOS 8+
    // The 'ph://' prefix is used by FBMediaKit to differentiate between
    // assets-library. It is prepended to the local ID so that it is in the
    // form of an, NSURL which is what assets-library uses.
    NSString *phAssetID = [imageTag substringFromIndex:@"ph://".length];
    PHFetchResult *results = [PHAsset fetchAssetsWithLocalIdentifiers:@[phAssetID] options:nil];
    if (results.count == 0) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to fetch PHAsset with local identifier %@ with no error message.", phAssetID];
      NSError *error = RCTErrorWithMessage(errorText);
      RCTDispatchCallbackOnMainQueue(completionBlock, error, nil);
      return ^{};
    }

    PHAsset *asset = results.firstObject;

    PHImageRequestOptions *imageOptions = [PHImageRequestOptions new];

    BOOL useMaximumSize = CGSizeEqualToSize(size, CGSizeZero);
    CGSize targetSize;

    if ( useMaximumSize ){
      targetSize = PHImageManagerMaximumSize;
      imageOptions.resizeMode = PHImageRequestOptionsResizeModeNone;
    } else {
      targetSize = size;
      imageOptions.resizeMode = PHImageRequestOptionsResizeModeFast;
    }

    PHImageContentMode contentMode = PHImageContentModeAspectFill;
    if (resizeMode == UIViewContentModeScaleAspectFit) {
      contentMode = PHImageContentModeAspectFit;
    }
    [[PHImageManager defaultManager] requestImageForAsset:asset targetSize:targetSize contentMode:contentMode options:imageOptions resultHandler:^(UIImage *result, NSDictionary *info) {
      if (result) {
        RCTDispatchCallbackOnMainQueue(completionBlock, nil, result);
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load PHAsset with local identifier %@ with no error message.", phAssetID];
        NSError *error = RCTErrorWithMessage(errorText);
        RCTDispatchCallbackOnMainQueue(completionBlock, error, nil);
        return;
      }
    }];
    return ^{};
  } else if ([imageTag hasPrefix:@"http"]) {
    NSURL *url = [RCTConvert NSURL:imageTag];
    if (!url) {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid URL: %@", imageTag];
      RCTDispatchCallbackOnMainQueue(completionBlock, RCTErrorWithMessage(errorMessage), nil);
      return ^{};
    }
    return [_bridge.imageDownloader downloadImageForURL:url size:size scale:scale resizeMode:resizeMode progressBlock:progressBlock completionBlock:^(NSError *error, id image) {
      RCTDispatchCallbackOnMainQueue(completionBlock, error, image);
    }];
  } else if ([imageTag hasPrefix:@"rct-image-store://"]) {
    [_bridge.imageStoreManager getImageForTag:imageTag withBlock:^(UIImage *image) {
      if (image) {
        RCTDispatchCallbackOnMainQueue(completionBlock, nil, image);
      } else {
        NSString *errorMessage = [NSString stringWithFormat:@"Unable to load image from image store: %@", imageTag];
        NSError *error = RCTErrorWithMessage(errorMessage);
        RCTDispatchCallbackOnMainQueue(completionBlock, error, nil);
      }
    }];
    return ^{};
  } else if ([imageTag.lowercaseString hasSuffix:@".gif"]) {
    id image = RCTGIFImageWithFileURL([RCTConvert NSURL:imageTag]);
    if (image) {
      RCTDispatchCallbackOnMainQueue(completionBlock, nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unable to load GIF image: %@", imageTag];
      NSError *error = RCTErrorWithMessage(errorMessage);
      RCTDispatchCallbackOnMainQueue(completionBlock, error, nil);
    }
    return ^{};
  } else {
    UIImage *image = [RCTConvert UIImage:imageTag];
    if (image) {
      RCTDispatchCallbackOnMainQueue(completionBlock, nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unrecognized tag protocol: %@", imageTag];
      NSError *error = RCTErrorWithMessage(errorMessage);
      RCTDispatchCallbackOnMainQueue(completionBlock, error, nil);
    }
    return ^{};
  }
}

+ (BOOL)isAssetLibraryImage:(NSString *)imageTag
{
  return [imageTag hasPrefix:@"assets-library://"] || [imageTag hasPrefix:@"ph://"];
}

+ (BOOL)isRemoteImage:(NSString *)imageTag
{
  return [imageTag hasPrefix:@"http://"] || [imageTag hasPrefix:@"https://"];
}

@end

@implementation RCTBridge (RCTImageLoader)

- (RCTImageLoader *)imageLoader
{
  return self.modules[RCTBridgeModuleNameForClass([RCTImageLoader class])];
}

- (ALAssetsLibrary *)assetsLibrary
{
  return [self.imageLoader assetsLibrary];
}

@end
