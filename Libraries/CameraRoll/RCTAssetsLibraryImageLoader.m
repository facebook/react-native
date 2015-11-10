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

          UIImage *image = nil;
          NSError *error = nil;
          if (useMaximumSize) {

            image = [UIImage imageWithCGImage:representation.fullResolutionImage
                                        scale:scale
                                  orientation:(UIImageOrientation)representation.orientation];
          } else {

            NSUInteger length = (NSUInteger)representation.size;
            uint8_t *buffer = (uint8_t *)malloc((size_t)length);
            if ([representation getBytes:buffer
                                fromOffset:0
                                    length:length
                                      error:&error]) {

              NSData *data = [[NSData alloc] initWithBytesNoCopy:buffer
                                                          length:length
                                                    freeWhenDone:YES];

              image = RCTDecodeImageWithData(data, size, scale, resizeMode);
            } else {
              free(buffer);
            }
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
