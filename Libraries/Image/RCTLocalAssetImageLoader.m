/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTLocalAssetImageLoader.h"

#import <libkern/OSAtomic.h>

#import "RCTUtils.h"

@implementation RCTLocalAssetImageLoader

RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return RCTIsLocalAssetURL(requestURL);
}

 - (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(RCTResizeMode)resizeMode
                                    progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                  completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  __block volatile uint32_t cancelled = 0;

  RCTExecuteOnMainQueue(^{
    if (cancelled) {
      return;
    }

    NSString *imageName = RCTBundlePathForURL(imageURL);

    // imageNamed handles the caching automatically so there is no
    // need to do any manual caching.
    UIImage *image = [UIImage imageNamed:imageName];
    if (image) {
      if (progressHandler) {
        progressHandler(1, 1);
      }
      completionHandler(nil, image);
    } else {
      NSString *message = [NSString stringWithFormat:@"Could not find image named %@", imageName];
      completionHandler(RCTErrorWithMessage(message), nil);
    }
  });

  return ^{
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

@end
