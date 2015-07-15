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

#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTGIFImage.h"
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

+ (ALAssetsLibrary *)assetsLibrary
{
  static ALAssetsLibrary *assetsLibrary = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    assetsLibrary = [[ALAssetsLibrary alloc] init];
  });
  return assetsLibrary;
}

+ (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithTag:imageTag
                           size:CGSizeZero
                          scale:0
                     resizeMode:UIViewContentModeScaleToFill
                  progressBlock:nil
                completionBlock:callback];
}

+ (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(UIViewContentMode)resizeMode
                                      progressBlock:(RCTImageLoaderProgressBlock)progress
                                    completionBlock:(RCTImageLoaderCompletionBlock)completion
{
  if ([imageTag hasPrefix:@"assets-library://"]) {
    [[RCTImageLoader assetsLibrary] assetForURL:[NSURL URLWithString:imageTag] resultBlock:^(ALAsset *asset) {
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
            ALAssetOrientation orientation = ALAssetOrientationUp;
            CGImageRef imageRef = NULL;

            if (!useMaximumSize) {
              imageRef = asset.thumbnail;
            }
            if (RCTUpscalingRequired((CGSize){CGImageGetWidth(imageRef), CGImageGetHeight(imageRef)}, 1, size, scale, resizeMode)) {
              if (!useMaximumSize) {
                imageRef = asset.aspectRatioThumbnail;
              }
              if (RCTUpscalingRequired((CGSize){CGImageGetWidth(imageRef), CGImageGetHeight(imageRef)}, 1, size, scale, resizeMode)) {
                ALAssetRepresentation *representation = [asset defaultRepresentation];
                orientation = [representation orientation];
                if (!useMaximumSize) {
                  imageRef = [representation fullScreenImage];
                }
                if (RCTUpscalingRequired((CGSize){CGImageGetWidth(imageRef), CGImageGetHeight(imageRef)}, 1, size, scale, resizeMode)) {
                  imageRef = [representation fullResolutionImage];
                }
              }
            }

            UIImage *image = [UIImage imageWithCGImage:imageRef scale:scale orientation:(UIImageOrientation)orientation];
            RCTDispatchCallbackOnMainQueue(completion, nil, image);
          }
        });
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@ with no error message.", imageTag];
        NSError *error = RCTErrorWithMessage(errorText);
        RCTDispatchCallbackOnMainQueue(completion, error, nil);
      }
    } failureBlock:^(NSError *loadError) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@.\niOS Error: %@", imageTag, loadError];
      NSError *error = RCTErrorWithMessage(errorText);
      RCTDispatchCallbackOnMainQueue(completion, error, nil);
    }];
    return ^{};
  } else if ([imageTag hasPrefix:@"ph://"]) {
    // Using PhotoKit for iOS 8+
    // The 'ph://' prefix is used by FBMediaKit to differentiate between
    // assets-library. It is prepended to the local ID so that it is in the
    // form of an, NSURL which is what assets-library uses.
    NSString *phAssetID = [imageTag substringFromIndex:[@"ph://" length]];
    PHFetchResult *results = [PHAsset fetchAssetsWithLocalIdentifiers:@[phAssetID] options:nil];
    if (results.count == 0) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to fetch PHAsset with local identifier %@ with no error message.", phAssetID];
      NSError *error = RCTErrorWithMessage(errorText);
      RCTDispatchCallbackOnMainQueue(completion, error, nil);
      return ^{};
    }

    PHAsset *asset = [results firstObject];
    CGSize targetSize = CGSizeEqualToSize(size, CGSizeZero) ? PHImageManagerMaximumSize : size;
    PHImageContentMode contentMode = PHImageContentModeAspectFill;
    if (resizeMode == UIViewContentModeScaleAspectFit) {
      contentMode = PHImageContentModeAspectFit;
    }
    [[PHImageManager defaultManager] requestImageForAsset:asset targetSize:targetSize contentMode:contentMode options:nil resultHandler:^(UIImage *result, NSDictionary *info) {
      if (result) {
        RCTDispatchCallbackOnMainQueue(completion, nil, result);
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load PHAsset with local identifier %@ with no error message.", phAssetID];
        NSError *error = RCTErrorWithMessage(errorText);
        RCTDispatchCallbackOnMainQueue(completion, error, nil);
        return;
      }
    }];
    return ^{};
  } else if ([imageTag hasPrefix:@"http"]) {
    NSURL *url = [NSURL URLWithString:imageTag];
    if (!url) {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid URL: %@", imageTag];
      RCTDispatchCallbackOnMainQueue(completion, RCTErrorWithMessage(errorMessage), nil);
      return ^{};
    }
    if ([imageTag.lowercaseString hasSuffix:@".gif"]) {
      return [[RCTImageDownloader sharedInstance] downloadDataForURL:url progressBlock:progress block:^(NSData *data, NSError *error) {
        id image = RCTGIFImageWithFileURL([RCTConvert NSURL:imageTag]);
        if (!image && !error) {
          NSString *errorMessage = [NSString stringWithFormat:@"Unable to load GIF image: %@", imageTag];
          error = RCTErrorWithMessage(errorMessage);
        }
        RCTDispatchCallbackOnMainQueue(completion, error, image);
      }];
    } else {
      return [[RCTImageDownloader sharedInstance] downloadImageForURL:url size:size scale:scale resizeMode:resizeMode tintColor:nil backgroundColor:nil progressBlock:progress block:^(UIImage *image, NSError *error) {
         RCTDispatchCallbackOnMainQueue(completion, error, image);
      }];
    }
  } else if ([imageTag.lowercaseString hasSuffix:@".gif"]) {
    id image = RCTGIFImageWithFileURL([RCTConvert NSURL:imageTag]);
    if (image) {
      RCTDispatchCallbackOnMainQueue(completion, nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unable to load GIF image: %@", imageTag];
      NSError *error = RCTErrorWithMessage(errorMessage);
      RCTDispatchCallbackOnMainQueue(completion, error, nil);
    }
    return ^{};
  } else {
    UIImage *image = [RCTConvert UIImage:imageTag];
    if (image) {
      RCTDispatchCallbackOnMainQueue(completion, nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unrecognized tag protocol: %@", imageTag];
      NSError *error = RCTErrorWithMessage(errorMessage);
      RCTDispatchCallbackOnMainQueue(completion, error, nil);
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
