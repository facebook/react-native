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
#import "RCTImageLoader.h"

@interface RCTImageDownloader : NSObject <RCTBridgeModule>

/**
 * Downloads an image and decompresses it a the size specified. The compressed
 * image will be cached in memory and to disk. Note that the callback block
 * will not be executed on the same thread you called the method from, nor on
 * the main thread. Returns a token that can be used to cancel the download.
 */
- (RCTImageLoaderCancellationBlock)downloadImageForURL:(NSURL *)url
                                                  size:(CGSize)size
                                                 scale:(CGFloat)scale
                                            resizeMode:(UIViewContentMode)resizeMode
                                         progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                       completionBlock:(RCTImageLoaderCompletionBlock)block;

@end

@interface RCTBridge (RCTImageDownloader)

@property (nonatomic, readonly) RCTImageDownloader *imageDownloader;

@end
