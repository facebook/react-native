/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <fabric/imagemanager/ImageRequest.h>
#import <fabric/imagemanager/primitives.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTImageLoader;

/**
 * iOS-specific ImageManager.
 */
@interface RCTImageManager : NSObject

- (instancetype)initWithImageLoader:(RCTImageLoader *)imageLoader;

- (facebook::react::ImageRequest)requestImage:(const facebook::react::ImageSource &)imageSource;

@end

NS_ASSUME_NONNULL_END
