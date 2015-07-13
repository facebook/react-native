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

+(CGImageRef )scaledImageRefForAssetRepresentation:(ALAssetRepresentation *)assetRepresentation maxPixelSize:(float)maxPixelSize
{
  NSData *data = nil;
  CGImageRef imageRef = nil;
  
  uint8_t *buffer = (uint8_t *)malloc(sizeof(uint8_t)*[assetRepresentation size]);
  if (buffer != NULL) {
    NSError *error = nil;
    NSUInteger bytesRead = [assetRepresentation getBytes:buffer fromOffset:0 length:[assetRepresentation size] error:&error];
    data = [NSData dataWithBytes:buffer length:bytesRead];
    
    free(buffer);
  }
  
  if ([data length]){
    CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)data, nil);
    
    NSMutableDictionary *options = [NSMutableDictionary dictionary];
    
    [options setObject:(id)kCFBooleanTrue forKey:(id)kCGImageSourceShouldAllowFloat];
    [options setObject:(id)kCFBooleanTrue forKey:(id)kCGImageSourceCreateThumbnailWithTransform];
    [options setObject:(id)kCFBooleanTrue forKey:(id)kCGImageSourceCreateThumbnailFromImageAlways];
    [options setObject:(id)[NSNumber numberWithFloat:maxPixelSize] forKey:(id)kCGImageSourceThumbnailMaxPixelSize];
    imageRef = CGImageSourceCreateThumbnailAtIndex(sourceRef, 0, (__bridge CFDictionaryRef)options);
    
    if (sourceRef){
      CFRelease(sourceRef);
    }
  }
  
  return imageRef;
}

/**
 * Can be called from any thread.
 * Will always call callback on main thread.
 */
+ (void)loadImageWithTag:(NSString *)imageTag options:(NSDictionary *)options callback:(void (^)(NSError *error, id image))callback
{
  if ([imageTag hasPrefix:@"assets-library"]) {
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
            ALAssetRepresentation *representation = [asset defaultRepresentation];
            ALAssetOrientation orientation = [representation orientation];

            CGImageRef ref = nil;
            UIImage *image = nil;

            if ([options[@"assetUseMaximumSize"] boolValue]) { // Full resolution
              ref = [[asset defaultRepresentation] fullResolutionImage];
              image = [UIImage imageWithCGImage:ref scale:[representation scale] orientation:(UIImageOrientation)orientation];
              
            } else {
              CGFloat retinaScale = [UIScreen mainScreen].scale;
              
              CGFloat targetWidth = [options[@"assetTargetSize"][@"width"] floatValue];
              CGFloat targetHeight = [options[@"assetTargetSize"][@"height"] floatValue];
              
              CGFloat fullWidth = [representation dimensions].width;
              CGFloat fullHeight = [representation dimensions].height;
              CGFloat fullAspectRatio = fullWidth / fullHeight;
              
              CGFloat maxPixelSize;

              if (fullWidth > fullHeight) {
                maxPixelSize = ceil((fullAspectRatio * targetHeight) * retinaScale);
              } else {
                maxPixelSize = ceil((targetWidth / fullAspectRatio) * retinaScale);
              }
              
              ref = [self scaledImageRefForAssetRepresentation:representation maxPixelSize:maxPixelSize];
              image = [UIImage imageWithCGImage:ref];
            }
            
            //RCTLogInfo(@"[%@] Full size: (%f, %f) Container: (%f, %f), Scale: %f, UIImage: (%f, %f), Memory=%.2fkb", [options[@"assetUseMaximumSize"] boolValue] ? @"Maximum" : @"Scaled", [representation dimensions].width, [representation dimensions].height, [options[@"assetTargetSize"][@"width"] floatValue], [options[@"assetTargetSize"][@"height"] floatValue], [UIScreen mainScreen].scale, image.size.width, image.size.height, (CGImageGetHeight(image.CGImage) * CGImageGetBytesPerRow(image.CGImage)) / 1024.0 );
            
            RCTDispatchCallbackOnMainQueue(callback, nil, image);
          }
        });
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@ with no error message.", imageTag];
        NSError *error = RCTErrorWithMessage(errorText);
        RCTDispatchCallbackOnMainQueue(callback, error, nil);
      }
    } failureBlock:^(NSError *loadError) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@.\niOS Error: %@", imageTag, loadError];
      NSError *error = RCTErrorWithMessage(errorText);
      RCTDispatchCallbackOnMainQueue(callback, error, nil);
    }];
  } else if ([imageTag hasPrefix:@"ph://"]) {
    // Using PhotoKit for iOS 8+
    // 'ph://' prefix is used by FBMediaKit to differentiate between assets-library. It is prepended to the local ID so that it
    // is in the form of NSURL which is what assets-library is based on.
    // This means if we use any FB standard photo picker, we will get this prefix =(
    NSString *phAssetID = [imageTag substringFromIndex:[@"ph://" length]];
    PHFetchResult *results = [PHAsset fetchAssetsWithLocalIdentifiers:@[phAssetID] options:nil];
    if (results.count == 0) {
      NSString *errorText = [NSString stringWithFormat:@"Failed to fetch PHAsset with local identifier %@ with no error message.", phAssetID];
      NSError *error = RCTErrorWithMessage(errorText);
      RCTDispatchCallbackOnMainQueue(callback, error, nil);
      return;
    }
    
    PHAsset *asset = [results firstObject];
    PHImageRequestOptions *imageOptions = [[PHImageRequestOptions alloc] init];
    
    // Resize Mode (default: PHImageRequestOptionsResizeModeFast)
    if ([options[@"resizeMode"] isEqualToString:@"fast"]) {
      imageOptions.resizeMode = PHImageRequestOptionsResizeModeFast;
    } else if ([options[@"resizeMode"] isEqualToString:@"exact"]) {
      imageOptions.resizeMode = PHImageRequestOptionsResizeModeExact;
    } else if ([options[@"resizeMode"] isEqualToString:@"none"]) {
      imageOptions.resizeMode = PHImageRequestOptionsResizeModeNone;
    } else {
      imageOptions.resizeMode = PHImageRequestOptionsResizeModeNone;
    }
    
    // Content Mode (default: PHImageContentModeAspectFill)
    PHImageContentMode contentMode;
    if ([options[@"contentMode"] isEqualToString:@"fill"]) {
      contentMode = PHImageContentModeAspectFill;
    } else if ([options[@"contentMode"] isEqualToString:@"fit"]) {
      contentMode = PHImageContentModeAspectFit;
    } else {
      contentMode = PHImageContentModeAspectFit;
    }
  
    float retinaScale = [UIScreen mainScreen].scale;
    CGSize targetSize;
    
    if ([options[@"assetUseMaximumSize"] boolValue]) {
      targetSize = PHImageManagerMaximumSize;
    } else {
      targetSize = CGSizeMake([options[@"targetSize"][@"width"] floatValue] * retinaScale,
                              [options[@"targetSize"][@"height"] floatValue] * retinaScale);
    }

    [[PHImageManager defaultManager] requestImageForAsset:asset targetSize:targetSize contentMode:contentMode options:imageOptions resultHandler:^(UIImage *result, NSDictionary *info) {
      if (result) {
        RCTDispatchCallbackOnMainQueue(callback, nil, result);
      } else {
        NSString *errorText = [NSString stringWithFormat:@"Failed to load PHAsset with local identifier %@ with no error message.", phAssetID];
        NSError *error = RCTErrorWithMessage(errorText);
        RCTDispatchCallbackOnMainQueue(callback, error, nil);
        return;
      }
    }];
    
  } else if ([imageTag hasPrefix:@"http"]) {
    NSURL *url = [NSURL URLWithString:imageTag];
    if (!url) {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid URL: %@", imageTag];
      RCTDispatchCallbackOnMainQueue(callback, RCTErrorWithMessage(errorMessage), nil);
      return;
    }
    [[RCTImageDownloader sharedInstance] downloadDataForURL:url block:^(NSData *data, NSError *error) {
      if (error) {
        RCTDispatchCallbackOnMainQueue(callback, error, nil);
      } else {
        RCTDispatchCallbackOnMainQueue(callback, nil, [UIImage imageWithData:data]);
      }
    }];
  } else if ([[imageTag lowercaseString] hasSuffix:@".gif"]) {
    id image = RCTGIFImageWithFileURL([RCTConvert NSURL:imageTag]);
    if (image) {
      RCTDispatchCallbackOnMainQueue(callback, nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unable to load GIF image: %@", imageTag];
      NSError *error = RCTErrorWithMessage(errorMessage);
      RCTDispatchCallbackOnMainQueue(callback, error, nil);
    }
  } else {
    UIImage *image = [RCTConvert UIImage:imageTag];
    if (image) {
      RCTDispatchCallbackOnMainQueue(callback, nil, image);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unrecognized tag protocol: %@", imageTag];
      NSError *error = RCTErrorWithMessage(errorMessage);
      RCTDispatchCallbackOnMainQueue(callback, error, nil);
    }
  }
}

@end
