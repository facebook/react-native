/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageDownloader.h"

#import "RCTDownloadTaskWrapper.h"
#import "RCTImageUtils.h"
#import "RCTLog.h"
#import "RCTUtils.h"

typedef void (^RCTCachedDataDownloadBlock)(BOOL cached, NSURLResponse *response,
                                           NSData *data, NSError *error);

CGSize RCTTargetSizeForClipRect(CGRect);
CGRect RCTClipRect(CGSize, CGFloat, CGSize, CGFloat, UIViewContentMode);

@implementation RCTImageDownloader
{
  NSURLCache *_cache;
  dispatch_queue_t _processingQueue;
  NSMutableDictionary *_pendingBlocks;
  RCTDownloadTaskWrapper *_downloadTaskWrapper;
}

+ (RCTImageDownloader *)sharedInstance
{
  static RCTImageDownloader *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[RCTImageDownloader alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _cache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024 diskCapacity:200 * 1024 * 1024 diskPath:@"React/RCTImageDownloader"];
    _processingQueue = dispatch_queue_create("com.facebook.React.DownloadProcessingQueue", DISPATCH_QUEUE_SERIAL);
    _pendingBlocks = [[NSMutableDictionary alloc] init];

    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    _downloadTaskWrapper = [[RCTDownloadTaskWrapper alloc] initWithSessionConfiguration:config delegateQueue:nil];
  }

  return self;
}

- (RCTImageDownloadCancellationBlock)_downloadDataForURL:(NSURL *)url
                                           progressBlock:progressBlock
                                                   block:(RCTCachedDataDownloadBlock)block
{
  NSString *const cacheKey = url.absoluteString;

  __block BOOL cancelled = NO;
  __block NSURLSessionDownloadTask *task = nil;

  RCTImageDownloadCancellationBlock cancel = ^{
    cancelled = YES;

    dispatch_async(_processingQueue, ^{
      NSMutableArray *pendingBlocks = self->_pendingBlocks[cacheKey];
      [pendingBlocks removeObject:block];
    });

    if (task) {
      [task cancel];
      task = nil;
    }
  };

  dispatch_async(_processingQueue, ^{
    NSMutableArray *pendingBlocks = _pendingBlocks[cacheKey];
    if (pendingBlocks) {
      [pendingBlocks addObject:block];
    } else {
      _pendingBlocks[cacheKey] = [NSMutableArray arrayWithObject:block];

      __weak RCTImageDownloader *weakSelf = self;
      RCTCachedDataDownloadBlock runBlocks = ^(BOOL cached, NSURLResponse *response, NSData *data, NSError *error) {

        if (!error && [response isKindOfClass:[NSHTTPURLResponse class]]) {
          NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
          if (httpResponse.statusCode != 200) {
            data = nil;
            error = [[NSError alloc] initWithDomain:NSURLErrorDomain
                                               code:httpResponse.statusCode
                                           userInfo:nil];
          }
        }

        dispatch_async(_processingQueue, ^{
          RCTImageDownloader *strongSelf = weakSelf;
          NSArray *blocks = strongSelf->_pendingBlocks[cacheKey];
          [strongSelf->_pendingBlocks removeObjectForKey:cacheKey];
          for (RCTCachedDataDownloadBlock downloadBlock in blocks) {
            downloadBlock(cached, response, data, error);
          }
        });
      };

      NSURLRequest *request = [NSURLRequest requestWithURL:url];
      task = [_downloadTaskWrapper downloadData:url progressBlock:progressBlock completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {

        if (!cancelled) {
          runBlocks(NO, response, data, error);
        }

        if (response && !error) {
          RCTImageDownloader *strongSelf = weakSelf;
          NSCachedURLResponse *cachedResponse = [[NSCachedURLResponse alloc] initWithResponse:response data:data userInfo:nil storagePolicy:NSURLCacheStorageAllowed];
          [strongSelf->_cache storeCachedResponse:cachedResponse forRequest:request];
        }
        task = nil;
      }];

      NSCachedURLResponse *cachedResponse = [_cache cachedResponseForRequest:request];
      if (cancelled) {
        return;
      }

      if (cachedResponse) {
        runBlocks(YES, cachedResponse.response, cachedResponse.data, nil);
      } else {
        [task resume];
      }
    }
  });

  return [cancel copy];
}

- (RCTImageDownloadCancellationBlock)downloadDataForURL:(NSURL *)url
                                          progressBlock:(RCTDataProgressBlock)progressBlock
                                                  block:(RCTDataDownloadBlock)block
{
  return [self _downloadDataForURL:url progressBlock:progressBlock block:^(BOOL cached, NSURLResponse *response, NSData *data, NSError *error) {
    block(data, error);
  }];
}

- (RCTImageDownloadCancellationBlock)downloadImageForURL:(NSURL *)url
                                                    size:(CGSize)size
                                                   scale:(CGFloat)scale
                                              resizeMode:(UIViewContentMode)resizeMode
                                               tintColor:(UIColor *)tintColor
                                         backgroundColor:(UIColor *)backgroundColor
                                           progressBlock:(RCTDataProgressBlock)progressBlock
                                                   block:(RCTImageDownloadBlock)block
{
  scale = scale ?: RCTScreenScale();

  return [self downloadDataForURL:url progressBlock:progressBlock block:^(NSData *data, NSError *error) {
    if (!data || error) {
      block(nil, error);
      return;
    }

    UIImage *image = [UIImage imageWithData:data scale:scale];
    if (image && !CGSizeEqualToSize(size, CGSizeZero)) {

      // Get scale and size
      CGRect imageRect = RCTClipRect(image.size, scale, size, scale, resizeMode);
      CGSize destSize = RCTTargetSizeForClipRect(imageRect);

      // Opacity optimizations
      UIColor *blendColor = nil;
      BOOL opaque = !RCTImageHasAlpha(image.CGImage);
      if (!opaque && backgroundColor) {
        CGFloat alpha;
        [backgroundColor getRed:NULL green:NULL blue:NULL alpha:&alpha];
        if (alpha > 0.999) { // no benefit to blending if background is translucent
          opaque = YES;
          blendColor = backgroundColor;
        }
      }

      // Decompress image at required size
      UIGraphicsBeginImageContextWithOptions(destSize, opaque, scale);
      if (blendColor) {
        [blendColor setFill];
        UIRectFill((CGRect){CGPointZero, destSize});
      }
      if (tintColor) {
        image = [image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        [tintColor setFill];
      }
      [image drawInRect:imageRect];
      image = UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();
    }

    block(image, nil);
  }];
}

@end
