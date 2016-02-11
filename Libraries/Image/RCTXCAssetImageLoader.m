/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTXCAssetImageLoader.h"

#import <libkern/OSAtomic.h>

#import "RCTUtils.h"

@implementation RCTXCAssetImageLoader

RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return RCTIsXCAssetURL(requestURL);
}

 - (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                         bundlePath:(NSString *)bundlePath
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(RCTResizeMode)resizeMode
                                    progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                  completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  __block volatile uint32_t cancelled = 0;
  dispatch_async(dispatch_get_main_queue(), ^{

    if (cancelled) {
      return;
    }
    NSString *imageName = RCTBundlePathForURL(imageURL);
    NSBundle *targetBundle = [NSBundle mainBundle];
    
    if (bundlePath) {
      NSString *targetBundleName = RCTBundlePathForURL([NSURL URLWithString:bundlePath]);
      
      NSArray *bundles = [NSBundle allBundles];
      for (NSBundle *bundle in bundles) {
        NSString *bundleName = bundle.infoDictionary[@"CFBundleName"];
        
        if ([bundleName isEqualToString:targetBundleName]) {
          targetBundle = bundle;
          break;
        }
      }
    }
    
    UIImage *image = [UIImage imageNamed:imageName inBundle:targetBundle compatibleWithTraitCollection:nil];
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
