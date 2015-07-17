/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@class ALAssetsLibrary;

@interface RCTImageLoader : NSObject

/**
 * The shared asset library instance.
 */
+ (ALAssetsLibrary *)assetsLibrary;

/**
 * Can be called from any thread.
 * Will always call callback on main thread.
 */
+ (void)loadImageWithTag:(NSString *)imageTag
                callback:(void (^)(NSError *error, id /* UIImage or CAAnimation */ image))callback;

/**
 * As above, but includes target size, scale and resizeMode, which are used to
 * select the optimal dimensions for the loaded image.
 */
+ (void)loadImageWithTag:(NSString *)imageTag
                    size:(CGSize)size
                   scale:(CGFloat)scale
              resizeMode:(UIViewContentMode)resizeMode
                callback:(void (^)(NSError *error, id /* UIImage or CAAnimation */ image))callback;

/**
 * Is the specified image tag an asset library image?
 */
+ (BOOL)isAssetLibraryImage:(NSString *)imageTag;

@end
