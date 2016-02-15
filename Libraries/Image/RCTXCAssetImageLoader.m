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
      NSString *targetBundleNameWithExtension = [NSString stringWithFormat:@"%@%@", targetBundleName, @".bundle"];
      NSMutableArray *bundles = [[NSBundle allBundles] mutableCopy];
      
      // Get any bundle files included in the mainBundle and add them to the array
      for (NSString *path in [[NSBundle mainBundle] pathsForResourcesOfType:@"bundle" inDirectory:nil]) {
        NSBundle *bundle = [NSBundle bundleWithPath:path];
        
        if (bundle && ![bundles containsObject:bundle]) {
          [bundles addObject:bundle];
        }
      }
      
      // Get any bundle files included and of the frameworks and add them to the array
      for (NSBundle *framework in [NSBundle allFrameworks]) {
        for (NSString *path in [framework pathsForResourcesOfType:@"bundle" inDirectory:nil]) {
          NSBundle *bundle = [NSBundle bundleWithPath:path];
          
          if (bundle && ![bundles containsObject:bundle]) {
            [bundles addObject:bundle];
          }
        }
      }
      
      for (NSBundle *bundle in bundles) {
        NSString *bundleName = bundle.infoDictionary[@"CFBundleName"];
        
        // Note: Looks like some frameworks won't have 'infoDictionary' set up correctly
        if (!bundleName) {
          bundleName = [bundle.bundleURL lastPathComponent];
        }
        
        if ([bundleName isEqualToString:targetBundleName] || [bundleName isEqualToString:targetBundleNameWithExtension]) {
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
