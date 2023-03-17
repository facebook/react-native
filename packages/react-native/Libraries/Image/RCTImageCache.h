/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTResizeMode.h>

@interface UIImage (React)

/**
 * Memory bytes of the image with the default calculation of static image or GIF. Custom calculations of decoded bytes
 * can be assigned manually.
 */
@property (nonatomic, assign) NSInteger reactDecodedImageBytes;

@end

/**
 * Provides an interface to use for providing a image caching strategy.
 */
@protocol RCTImageCache <NSObject>

- (UIImage *)imageForUrl:(NSString *)url size:(CGSize)size scale:(CGFloat)scale resizeMode:(RCTResizeMode)resizeMode;

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(RCTResizeMode)resizeMode
               response:(NSURLResponse *)response;

@end

@interface RCTImageCache : NSObject <RCTImageCache>

RCT_EXTERN void RCTSetImageCacheLimits(
    NSUInteger maxCachableDecodedImageSizeInBytes,
    NSUInteger imageCacheTotalCostLimit);

@end
