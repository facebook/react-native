/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageDownloader.h"

#import "RCTCache.h"
#import "RCTLog.h"
#import "RCTUtils.h"

typedef void (^RCTCachedDataDownloadBlock)(BOOL cached, NSData *data, NSError *error);

@implementation RCTImageDownloader
{
  RCTCache *_cache;
  dispatch_queue_t _processingQueue;
  NSMutableDictionary *_pendingBlocks;
}

+ (instancetype)sharedInstance
{
  static RCTImageDownloader *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _cache = [[RCTCache alloc] initWithName:@"RCTImageDownloader"];
    _processingQueue = dispatch_queue_create("com.facebook.React.DownloadProcessingQueue", DISPATCH_QUEUE_SERIAL);
    _pendingBlocks = [[NSMutableDictionary alloc] init];
  }
  return self;
}

static NSString *RCTCacheKeyForURL(NSURL *url)
{
  return url.absoluteString;
}

- (id)_downloadDataForURL:(NSURL *)url block:(RCTCachedDataDownloadBlock)block
{
  NSString *cacheKey = RCTCacheKeyForURL(url);

  __block BOOL cancelled = NO;
  __block NSURLSessionDataTask *task = nil;

  dispatch_block_t cancel = ^{

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
      RCTCachedDataDownloadBlock runBlocks = ^(BOOL cached, NSData *data, NSError *error) {
        dispatch_async(_processingQueue, ^{
          RCTImageDownloader *strongSelf = weakSelf;
          NSArray *blocks = strongSelf->_pendingBlocks[cacheKey];
          [strongSelf->_pendingBlocks removeObjectForKey:cacheKey];
          for (RCTCachedDataDownloadBlock block in blocks) {
            block(cached, data, error);
          }
        });
      };

      if ([_cache hasDataForKey:cacheKey]) {
        [_cache fetchDataForKey:cacheKey completionHandler:^(NSData *data) {
          if (!cancelled) {
            runBlocks(YES, data, nil);
          }
        }];
      } else {
        task = [[NSURLSession sharedSession] dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
          if (!cancelled) {
            runBlocks(NO, data, error);
          }
        }];

        [task resume];
      }
    }
  });

  return [cancel copy];
}

- (id)downloadDataForURL:(NSURL *)url block:(RCTDataDownloadBlock)block
{
  NSString *cacheKey = RCTCacheKeyForURL(url);
  __weak RCTImageDownloader *weakSelf = self;
  return [self _downloadDataForURL:url block:^(BOOL cached, NSData *data, NSError *error) {
    if (!cached) {
      RCTImageDownloader *strongSelf = weakSelf;
      [strongSelf->_cache setData:data forKey:cacheKey];
    }
    block(data, error);
  }];
}

/**
 * Returns the optimal context size for an image drawn using the clip rect
 * returned by RCTClipRect.
 */
CGSize RCTTargetSizeForClipRect(CGRect);
CGSize RCTTargetSizeForClipRect(CGRect clipRect)
{
  return (CGSize){
    clipRect.size.width + clipRect.origin.x * 2,
    clipRect.size.height + clipRect.origin.y * 2
  };
}

/**
 * This function takes an input content size & scale (typically from an image),
 * a target size & scale that it will be drawn into (typically a CGContext) and
 * then calculates the optimal rectangle to draw the image into so that it will
 * be sized and positioned correctly if drawn using the specified content mode.
 */
CGRect RCTClipRect(CGSize, CGFloat, CGSize, CGFloat, UIViewContentMode);
CGRect RCTClipRect(CGSize sourceSize, CGFloat sourceScale,
                   CGSize destSize, CGFloat destScale,
                   UIViewContentMode resizeMode)
{
  // Precompensate for scale
  CGFloat scale = sourceScale / destScale;
  sourceSize.width *= scale;
  sourceSize.height *= scale;

  // Calculate aspect ratios if needed (don't bother is resizeMode == stretch)
  CGFloat aspect = 0.0, targetAspect = 0.0;
  if (resizeMode != UIViewContentModeScaleToFill) {
    aspect = sourceSize.width / sourceSize.height;
    targetAspect = destSize.width / destSize.height;
    if (aspect == targetAspect) {
      resizeMode = UIViewContentModeScaleToFill;
    }
  }

  switch (resizeMode) {
    case UIViewContentModeScaleToFill: // stretch

      sourceSize.width = MIN(destSize.width, sourceSize.width);
      sourceSize.height = MIN(destSize.height, sourceSize.height);
      return (CGRect){CGPointZero, sourceSize};

    case UIViewContentModeScaleAspectFit: // contain

      if (targetAspect <= aspect) { // target is taller than content
        sourceSize.width = destSize.width = MIN(sourceSize.width, destSize.width);
        sourceSize.height = sourceSize.width / aspect;
      } else { // target is wider than content
        sourceSize.height = destSize.height = MIN(sourceSize.height, destSize.height);
        sourceSize.width = sourceSize.height * aspect;
      }
      return (CGRect){CGPointZero, sourceSize};

    case UIViewContentModeScaleAspectFill: // cover

      if (targetAspect <= aspect) { // target is taller than content

        sourceSize.height = destSize.height = MIN(sourceSize.height, destSize.height);
        sourceSize.width = sourceSize.height * aspect;
        destSize.width = destSize.height * targetAspect;
        return (CGRect){{(destSize.width - sourceSize.width) / 2, 0}, sourceSize};

      } else { // target is wider than content

        sourceSize.width = destSize.width = MIN(sourceSize.width, destSize.width);
        sourceSize.height = sourceSize.width / aspect;
        destSize.height = destSize.width / targetAspect;
        return (CGRect){{0, (destSize.height - sourceSize.height) / 2}, sourceSize};
      }

    default:

      RCTLogError(@"A resizeMode value of %zd is not supported", resizeMode);
      return (CGRect){CGPointZero, destSize};
  }
}

- (id)downloadImageForURL:(NSURL *)url
                     size:(CGSize)size
                    scale:(CGFloat)scale
               resizeMode:(UIViewContentMode)resizeMode
          backgroundColor:(UIColor *)backgroundColor
                    block:(RCTImageDownloadBlock)block
{
  return [self downloadDataForURL:url block:^(NSData *data, NSError *error) {

    if (!data || error) {
      block(nil, error);
      return;
    }

    if (CGSizeEqualToSize(size, CGSizeZero)) {
      // Target size wasn't available yet, so abort image drawing
      block(nil, nil);
      return;
    }

    UIImage *image = [UIImage imageWithData:data scale:scale];
    if (image) {

      // Get scale and size
      CGFloat destScale = scale ?: RCTScreenScale();
      CGRect imageRect = RCTClipRect(image.size, image.scale, size, destScale, resizeMode);
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
      UIGraphicsBeginImageContextWithOptions(destSize, opaque, destScale);
      if (blendColor) {
        [blendColor setFill];
        UIRectFill((CGRect){CGPointZero, destSize});
      }
      [image drawInRect:imageRect];
      image = UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();
    }
    block(image, nil);
  }];
}

- (void)cancelDownload:(id)downloadToken
{
  if (downloadToken) {
    ((dispatch_block_t)downloadToken)();
  }
}

@end
