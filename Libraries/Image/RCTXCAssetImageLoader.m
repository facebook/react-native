/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTXCAssetImageLoader.h"

#import "RCTUtils.h"

@implementation RCTXCAssetImageLoader

RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return RCTIsXCAssetURL(requestURL);
}

- (float)imageLoaderPriority
{
  return 100; // higher priority than any ordinary file loader
}

 - (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL size:(CGSize)size scale:(CGFloat)scale resizeMode:(UIViewContentMode)resizeMode progressHandler:(RCTImageLoaderProgressBlock)progressHandler completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  __block BOOL cancelled = NO;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (cancelled) {
      return;
    }

    NSString *imageName = RCTBundlePathForURL(imageURL);
    UIImage *image = [UIImage imageNamed:imageName];
    if (image) {
      if (progressHandler) {
        progressHandler(1, 1);
      }

      if (completionHandler) {
        completionHandler(nil, image);
      }
    } else {
      if (completionHandler) {
        NSString *message = [NSString stringWithFormat:@"Could not find image named %@", imageName];
        completionHandler(RCTErrorWithMessage(message), nil);
      }
    }
  });

  return ^{
    cancelled = YES;
  };
}

@end
