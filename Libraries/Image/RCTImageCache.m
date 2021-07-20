/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageCache.h>

#import <objc/runtime.h>

#import <ImageIO/ImageIO.h>

#import <React/RCTConvert.h>
#import <React/RCTNetworking.h>
#import <React/RCTUtils.h>
#import <React/RCTResizeMode.h>

#import <React/RCTImageUtils.h>

static const NSUInteger RCTMaxCachableDecodedImageSizeInBytes = 2097152; // 2 MB

static NSString *RCTCacheKeyForImage(NSString *imageTag, CGSize size, CGFloat scale,
                                     RCTResizeMode resizeMode)
{
  return [NSString stringWithFormat:@"%@|%g|%g|%g|%lld",
          imageTag, size.width, size.height, scale, (long long)resizeMode];
}

@implementation RCTImageCache
{
  NSOperationQueue *_imageDecodeQueue;
  NSCache *_decodedImageCache;
  NSMutableDictionary *_cacheStaleTimes;
}

- (instancetype)init
{
  if (self = [super init]) {
    _decodedImageCache = [NSCache new];
    _decodedImageCache.totalCostLimit = 20 * 1024 * 1024; // 20 MB
    _cacheStaleTimes = [[NSMutableDictionary alloc] init];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(clearCache)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(clearCache)
                                                 name:UIApplicationWillResignActiveNotification
                                               object:nil];
  }

  return self;
}

- (void)clearCache
{
  [_decodedImageCache removeAllObjects];
  @synchronized(_cacheStaleTimes) {
    [_cacheStaleTimes removeAllObjects];
  }
}

- (void)addImageToCache:(UIImage *)image
                 forKey:(NSString *)cacheKey
{
  if (!image) {
    return;
  }
  NSInteger bytes = image.reactDecodedImageBytes;
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
{
  NSString *cacheKey = RCTCacheKeyForImage(url, size, scale, resizeMode);
  @synchronized(_cacheStaleTimes) {
    id staleTime = _cacheStaleTimes[cacheKey];
    if (staleTime) {
      if ([[NSDate new] compare:(NSDate *)staleTime] == NSOrderedDescending) {
        // cached image has expired, clear it out to make room for others
        [_cacheStaleTimes removeObjectForKey:cacheKey];
        [_decodedImageCache removeObjectForKey:cacheKey];
        return nil;
      }
    }
  }
  return [_decodedImageCache objectForKey:cacheKey];
}

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(RCTResizeMode)resizeMode
               response:(NSURLResponse *)response
{
  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    NSString *cacheKey = RCTCacheKeyForImage(url, size, scale, resizeMode);
    BOOL shouldCache = YES;
    NSString *responseDate = ((NSHTTPURLResponse *)response).allHeaderFields[@"Date"];
    NSDate *originalDate = [self dateWithHeaderString:responseDate];
    NSString *cacheControl = ((NSHTTPURLResponse *)response).allHeaderFields[@"Cache-Control"];
    NSDate *staleTime;
    NSArray<NSString *> *components = [cacheControl componentsSeparatedByString:@","];
    for (NSString *component in components) {
      if ([component containsString:@"no-cache"] || [component containsString:@"no-store"] || [component hasSuffix:@"max-age=0"]) {
        shouldCache = NO;
        break;
      } else {
        NSRange range = [component rangeOfString:@"max-age="];
        if (range.location != NSNotFound) {
          NSInteger seconds = [[component substringFromIndex:range.location + range.length] integerValue];
          staleTime = [originalDate dateByAddingTimeInterval:(NSTimeInterval)seconds];
        }
      }
    }
    if (shouldCache) {
      if (!staleTime && originalDate) {
        NSString *expires = ((NSHTTPURLResponse *)response).allHeaderFields[@"Expires"];
        NSString *lastModified = ((NSHTTPURLResponse *)response).allHeaderFields[@"Last-Modified"];
        if (expires) {
          staleTime = [self dateWithHeaderString:expires];
        } else if (lastModified) {
          NSDate *lastModifiedDate = [self dateWithHeaderString:lastModified];
          if (lastModifiedDate) {
            NSTimeInterval interval = [originalDate timeIntervalSinceDate:lastModifiedDate] / 10;
            staleTime = [originalDate dateByAddingTimeInterval:interval];
          }
        }
      }
      if (staleTime) {
        @synchronized(_cacheStaleTimes) {
          _cacheStaleTimes[cacheKey] = staleTime;
        }
      }
      return [self addImageToCache:image forKey:cacheKey];
    }
  }
}

- (NSDate *)dateWithHeaderString:(NSString *)headerDateString {
  static NSDateFormatter *formatter;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    formatter = [[NSDateFormatter alloc] init];
    formatter.locale = [[NSLocale alloc] initWithLocaleIdentifier:@"en_US_POSIX"];
    formatter.dateFormat = @"EEE',' dd MMM yyyy HH':'mm':'ss 'GMT'";
    formatter.timeZone = [NSTimeZone timeZoneForSecondsFromGMT:0];
  });

  return [formatter dateFromString:headerDateString];
}

@end
