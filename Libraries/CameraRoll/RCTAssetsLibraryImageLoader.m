/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAssetsLibraryImageLoader.h"

#import <AssetsLibrary/AssetsLibrary.h>
#import <ImageIO/ImageIO.h>
#import <libkern/OSAtomic.h>
#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTImageLoader.h"
#import "RCTImageUtils.h"
#import "RCTUtils.h"

static dispatch_queue_t RCTAssetsLibraryImageLoaderQueue(void);
static UIImage *RCTScaledImageForAsset(ALAssetRepresentation *representation, CGSize size, CGFloat scale, UIViewContentMode resizeMode, NSError **error);

@implementation RCTAssetsLibraryImageLoader
{
  ALAssetsLibrary *_assetsLibrary;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (ALAssetsLibrary *)assetsLibrary
{
  return _assetsLibrary ?: (_assetsLibrary = [ALAssetsLibrary new]);
}

#pragma mark - RCTImageLoader

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return [requestURL.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame;
}

- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(UIViewContentMode)resizeMode
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  __block volatile uint32_t cancelled = 0;

  [[self assetsLibrary] assetForURL:imageURL resultBlock:^(ALAsset *asset) {
    if (cancelled) {
      return;
    }

    if (asset) {
      // ALAssetLibrary API is async and will be multi-threaded. Loading a few full
      // resolution images at once will spike the memory up to store the image data,
      // and might trigger memory warnings and/or OOM crashes.
      // To improve this, process the loaded asset in a serial queue.
      dispatch_async(RCTAssetsLibraryImageLoaderQueue(), ^{
        if (cancelled) {
          return;
        }

        // Also make sure the image is released immediately after it's used so it
        // doesn't spike the memory up during the process.
        @autoreleasepool {
          BOOL useMaximumSize = CGSizeEqualToSize(size, CGSizeZero);
          ALAssetRepresentation *representation = [asset defaultRepresentation];

#if RCT_DEV

          CGSize sizeBeingLoaded = size;
          if (useMaximumSize) {
            CGSize pointSize = representation.dimensions;
            sizeBeingLoaded = CGSizeMake(pointSize.width * representation.scale, pointSize.height * representation.scale);
          }

          CGSize screenSize;
          if ([[[UIDevice currentDevice] systemVersion] compare:@"8.0" options:NSNumericSearch] == NSOrderedDescending) {
            screenSize = [UIScreen mainScreen].nativeBounds.size;
          } else {
            CGSize mainScreenSize = [UIScreen mainScreen].bounds.size;
            CGFloat mainScreenScale = [[UIScreen mainScreen] scale];
            screenSize = CGSizeMake(mainScreenSize.width * mainScreenScale, mainScreenSize.height * mainScreenScale);
          }
          CGFloat maximumPixelDimension = fmax(screenSize.width, screenSize.height);

          if (sizeBeingLoaded.width > maximumPixelDimension || sizeBeingLoaded.height > maximumPixelDimension) {
            RCTLogInfo(@"[PERF ASSETS] Loading %@ at size %@, which is larger than screen size %@",
                       representation.filename, NSStringFromCGSize(sizeBeingLoaded), NSStringFromCGSize(screenSize));
          }

#endif

          UIImage *image;
          NSError *error = nil;
          if (useMaximumSize) {
            image = [UIImage imageWithCGImage:representation.fullResolutionImage
                                        scale:scale
                                  orientation:(UIImageOrientation)representation.orientation];
          } else {
            image = RCTScaledImageForAsset(representation, size, scale, resizeMode, &error);
          }

          completionHandler(error, image);
        }
      });
    } else {
      NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@ with no error message.", imageURL];
      completionHandler(RCTErrorWithMessage(errorText), nil);
    }
  } failureBlock:^(NSError *loadError) {
    if (cancelled) {
      return;
    }

    NSString *errorText = [NSString stringWithFormat:@"Failed to load asset at URL %@.\niOS Error: %@", imageURL, loadError];
    completionHandler(RCTErrorWithMessage(errorText), nil);
  }];

  return ^{
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

@end

@implementation RCTBridge (RCTAssetsLibraryImageLoader)

- (ALAssetsLibrary *)assetsLibrary
{
  return [self.modules[RCTBridgeModuleNameForClass([RCTAssetsLibraryImageLoader class])] assetsLibrary];
}

@end

static dispatch_queue_t RCTAssetsLibraryImageLoaderQueue(void)
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.RCTAssetsLibraryImageLoader", DISPATCH_QUEUE_SERIAL);
  });

  return queue;
}

// Why use a custom scaling method? Greater efficiency, reduced memory overhead:
// http://www.mindsea.com/2012/12/downscaling-huge-alassets-without-fear-of-sigkill

static UIImage *RCTScaledImageForAsset(ALAssetRepresentation *representation,
                                       CGSize size,
                                       CGFloat scale,
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
