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

- (id)downloadDataForURL:(NSURL *)url
                   block:(RCTDataDownloadBlock)block;

- (id)downloadImageForURL:(NSURL *)url
                     size:(CGSize)size
                    scale:(CGFloat)scale
                    block:(RCTImageDownloadBlock)block;

- (void)cancelDownload:(id)downloadToken;

@end
