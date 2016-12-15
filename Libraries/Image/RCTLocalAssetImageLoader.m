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

#import <React/RCTUtils.h>

@implementation RCTLocalAssetImageLoader

RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return RCTIsLocalAssetURL(requestURL);
}

- (BOOL)requiresScheduling
{
  // Don't schedule this loader on the URL queue so we can load the
  // local assets synchronously to avoid flickers.
  return NO;
}

- (BOOL)shouldCacheLoadedImages
{
  // UIImage imageNamed handles the caching automatically so we don't want
  // to add it to the image cache.
  return NO;
}

static NSString *bundleName(NSBundle *bundle)
{
  NSString *name = bundle.infoDictionary[@"CFBundleName"];
  if (!name) {
    name = [[bundle.bundlePath lastPathComponent] stringByDeletingPathExtension];
  }
  return name;
}

static NSBundle *bundleForPath(NSString *key)
{
  static NSMutableDictionary *bundleCache;
  if (!bundleCache) {
    bundleCache = [NSMutableDictionary new];
    bundleCache[@"main"] = [NSBundle mainBundle];

    // Initialize every bundle in the array
    for (NSString *path in [[NSBundle mainBundle] pathsForResourcesOfType:@"bundle" inDirectory:nil]) {
      [NSBundle bundleWithPath:path];
    }

    // The bundles initialized above will now also be in `allBundles`
    for (NSBundle *bundle in [NSBundle allBundles]) {
      bundleCache[bundleName(bundle)] = bundle;
    }
  }

  return bundleCache[key];
}

 - (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(RCTResizeMode)resizeMode
                                    progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                 partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                  completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  __block volatile uint32_t cancelled = 0;
  RCTExecuteOnMainQueue(^{
    if (cancelled) {
      return;
    }

    NSString *imageName = RCTBundlePathForURL(imageURL);

    NSBundle *bundle;
    NSArray *imagePathComponents = [imageName pathComponents];
    if ([imagePathComponents count] > 1 &&
        [[[imagePathComponents firstObject] pathExtension] isEqualToString:@"bundle"]) {
      NSString *bundlePath = [imagePathComponents firstObject];
      bundle = bundleForPath([bundlePath stringByDeletingPathExtension]);
      imageName = [imageName substringFromIndex:(bundlePath.length + 1)];
    }

    UIImage *image;
    if (bundle) {
      image = [UIImage imageNamed:imageName inBundle:bundle compatibleWithTraitCollection:nil];
    } else {
      image = [UIImage imageNamed:imageName];
    }

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
