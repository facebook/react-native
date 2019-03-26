/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageCache.h"

#import <objc/runtime.h>

#import <ImageIO/ImageIO.h>

#import <React/RCTConvert.h>
#import <React/RCTNetworking.h>
#import <React/RCTUtils.h>
#import <React/RCTResizeMode.h>

#import "RCTImageUtils.h"

static const NSUInteger RCTMaxCachableDecodedImageSizeInBytes = 1048576; // 1MB

static NSString *RCTCacheKeyForImage(NSString *imageTag, CGSize size, CGFloat scale,
                                     RCTResizeMode resizeMode, NSString *responseDate)
{
  return [NSString stringWithFormat:@"%@|%g|%g|%g|%lld|%@",
          imageTag, size.width, size.height, scale, (long long)resizeMode, responseDate];
}

@implementation RCTImageCache
{
  NSOperationQueue *_imageDecodeQueue;
  NSCache *_decodedImageCache;
}

- (instancetype)init
{
  _decodedImageCache = [NSCache new];
  _decodedImageCache.totalCostLimit = 5 * 1024 * 1024; // 5MB

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(clearCache)
                                               name:UIApplicationDidReceiveMemoryWarningNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(clearCache)
                                               name:UIApplicationWillResignActiveNotification
                                             object:nil];
#endif // TODO(macOS ISS#2323203)

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)clearCache
{
  [_decodedImageCache removeAllObjects];
}
#endif // TODO(macOS ISS#2323203)

- (void)addImageToCache:(UIImage *)image
                 forKey:(NSString *)cacheKey
{
  if (!image) {
    return;
  }
  CGFloat imageScale = UIImageGetScale(image); // TODO(macOS ISS#2323203)
  CGFloat bytes = image.size.width * image.size.height * imageScale * imageScale * 4; // TODO(macOS ISS#2323203)
  if (bytes <= RCTMaxCachableDecodedImageSizeInBytes) {
    [self->_decodedImageCache setObject:image
                                 forKey:cacheKey
                                   cost:bytes];
  }
}

- (UIImage *)imageForUrl:(NSString *)url
                    size:(CGSize)size
                   scale:(CGFloat)scale
              resizeMode:(RCTResizeMode)resizeMode
            responseDate:(NSString *)responseDate
{
  NSString *cacheKey = RCTCacheKeyForImage(url, size, scale, resizeMode, responseDate);
  return [_decodedImageCache objectForKey:cacheKey];
}

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(RCTResizeMode)resizeMode
           responseDate:(NSString *)responseDate
{
  NSString *cacheKey = RCTCacheKeyForImage(url, size, scale, resizeMode, responseDate);
  return [self addImageToCache:image forKey:cacheKey];
}

@end
