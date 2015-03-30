/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

typedef void (^RCTDataDownloadBlock)(NSData *data, NSError *error);
typedef void (^RCTImageDownloadBlock)(UIImage *image, NSError *error);

@interface RCTImageDownloader : NSObject

+ (instancetype)sharedInstance;

/**
 * Downloads a block of raw data and returns it. Note that the callback block
 * will not be executed on the same thread you called the method from, nor on
 * the main thread. Returns a token that can be used to cancel the download.
 */
- (id)downloadDataForURL:(NSURL *)url
                   block:(RCTDataDownloadBlock)block;

/**
 * Downloads an image and decompresses it a the size specified. The compressed
 * image will be cached in memory and to disk. Note that the callback block
 * will not be executed on the same thread you called the method from, nor on
 * the main thread. Returns a token that can be used to cancel the download.
 */
- (id)downloadImageForURL:(NSURL *)url
                     size:(CGSize)size
                    scale:(CGFloat)scale
                    block:(RCTImageDownloadBlock)block;

/**
 * Cancel an in-flight download. If multiple requets have been made for the
 * same image, only the request that relates to the token passed will be
 * cancelled.
 */
- (void)cancelDownload:(id)downloadToken;

@end
