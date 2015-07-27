/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridge.h"

@class ALAssetsLibrary;

typedef void (^RCTImageLoaderProgressBlock)(int64_t progress, int64_t total);
typedef void (^RCTImageLoaderCompletionBlock)(NSError *error, id image /* UIImage or CAAnimation */);
typedef void (^RCTImageLoaderCancellationBlock)(void);

@interface RCTImageLoader : NSObject <RCTBridgeModule>

/**
 * Loads the specified image at the highest available resolution.
 * Can be called from any thread, will always call callback on main thread.
 */
- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(RCTImageLoaderCompletionBlock)callback;

/**
 * As above, but includes target size, scale and resizeMode, which are used to
 * select the optimal dimensions for the loaded image.
 */
- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(UIViewContentMode)resizeMode
                                      progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Is the specified image tag an asset library image?
 */
+ (BOOL)isAssetLibraryImage:(NSString *)imageTag;

/**
 * Is the specified image tag a remote image?
 */
+ (BOOL)isRemoteImage:(NSString *)imageTag;

@end

@interface RCTBridge (RCTImageLoader)

/**
 * The shared image loader instance
 */
@property (nonatomic, readonly) RCTImageLoader *imageLoader;

/**
 * The shared asset library instance.
 */
@property (nonatomic, readonly) ALAssetsLibrary *assetsLibrary;

@end
