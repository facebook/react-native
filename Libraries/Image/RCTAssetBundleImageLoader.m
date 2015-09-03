/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAssetBundleImageLoader.h"

#import "RCTUtils.h"

@implementation RCTAssetBundleImageLoader

RCT_EXPORT_MODULE()

- (NSString *)imageNameForRequestURL:(NSURL *)requestURL
{
  if (!requestURL.fileURL) {
    return nil;
  }

  NSString *resourcesPath = [NSBundle mainBundle].resourcePath;
  NSString *requestPath = requestURL.absoluteURL.path;
  if (requestPath.length < resourcesPath.length + 1) {
    return nil;
  }

  return [requestPath substringFromIndex:resourcesPath.length + 1];
}

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  NSString *imageName = [self imageNameForRequestURL:requestURL];
  if (!imageName.length) {
    return NO;
  }

  if ([[NSBundle mainBundle] URLForResource:imageName withExtension:nil] ||
      [[NSBundle mainBundle] URLForResource:imageName withExtension:@"png"]) {
    return YES;
  }

  return imageName.pathComponents.count == 1 && !imageName.pathExtension.length;
}

 - (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL size:(CGSize)size scale:(CGFloat)scale resizeMode:(UIViewContentMode)resizeMode progressHandler:(RCTImageLoaderProgressBlock)progressHandler completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  NSString *imageName = [self imageNameForRequestURL:imageURL];

  __block BOOL cancelled = NO;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (cancelled) {
      return;
    }

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
