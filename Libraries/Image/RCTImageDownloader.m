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
#import "RCTUtils.h"

typedef void (^RCTCachedDataDownloadBlock)(BOOL cached, NSData *data, NSError *error);

@implementation RCTImageDownloader
{
  RCTCache *_cache;
  NSMutableDictionary *_pendingBlocks;
}

+ (instancetype)sharedInstance
{
  RCTAssertMainThread();
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
    _pendingBlocks = [NSMutableDictionary dictionary];
  }
  return self;
}

- (NSString *)cacheKeyForURL:(NSURL *)url
{
  return url.absoluteString;
}

- (id)_downloadDataForURL:(NSURL *)url block:(RCTCachedDataDownloadBlock)block
{
  NSString *cacheKey = [self cacheKeyForURL:url];

  __block BOOL cancelled = NO;
  __block NSURLSessionDataTask *task = nil;
  dispatch_block_t cancel = ^{
    cancelled = YES;

    NSMutableArray *pendingBlocks = _pendingBlocks[cacheKey];
    [pendingBlocks removeObject:block];

    if (task) {
      [task cancel];
      task = nil;
    }
  };

  NSMutableArray *pendingBlocks = _pendingBlocks[cacheKey];
  if (pendingBlocks) {
    [pendingBlocks addObject:block];
  } else {
    _pendingBlocks[cacheKey] = [NSMutableArray arrayWithObject:block];

    __weak RCTImageDownloader *weakSelf = self;
    RCTCachedDataDownloadBlock runBlocks = ^(BOOL cached, NSData *data, NSError *error) {
      RCTImageDownloader *strongSelf = weakSelf;
      NSArray *blocks = strongSelf->_pendingBlocks[cacheKey];
      [strongSelf->_pendingBlocks removeObjectForKey:cacheKey];

      for (RCTCachedDataDownloadBlock block in blocks) {
        block(cached, data, error);
      }
    };

    if ([_cache hasDataForKey:cacheKey]) {
      [_cache fetchDataForKey:cacheKey completionHandler:^(NSData *data) {
        if (!cancelled) runBlocks(YES, data, nil);
      }];
    } else {
      task = [[NSURLSession sharedSession] dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (!cancelled) runBlocks(NO, data, error);
      }];

      [task resume];
    }
  }

  return [cancel copy];
}

- (id)downloadDataForURL:(NSURL *)url block:(RCTDataDownloadBlock)block
{
  NSString *cacheKey = [self cacheKeyForURL:url];
  __weak RCTImageDownloader *weakSelf = self;
  return [self _downloadDataForURL:url block:^(BOOL cached, NSData *data, NSError *error) {
    if (!cached) {
      RCTImageDownloader *strongSelf = weakSelf;
      [strongSelf->_cache setData:data forKey:cacheKey];
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      block(data, error);
    });
  }];
}

- (id)downloadImageForURL:(NSURL *)url size:(CGSize)size scale:(CGFloat)scale block:(RCTImageDownloadBlock)block
{
  return [self downloadDataForURL:url block:^(NSData *data, NSError *error) {

    UIImage *image = [UIImage imageWithData:data scale:scale];
    if (image) {

      // Resize (TODO: should we take aspect ratio into account?)
      CGSize imageSize = size;
      if (CGSizeEqualToSize(imageSize, CGSizeZero)) {
        imageSize = image.size;
      } else {
        imageSize = (CGSize){
          MIN(size.width, image.size.width),
          MIN(size.height, image.size.height)
        };
      }

      // Rescale image if required size is smaller
      CGFloat imageScale = scale;
      if (imageScale == 0 || imageScale < image.scale) {
        imageScale = image.scale;
      }

      // Decompress image at required size
      UIGraphicsBeginImageContextWithOptions(imageSize, NO, imageScale);
      [image drawInRect:(CGRect){{0, 0}, imageSize}];
      image = UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();
    }

    // TODO: should we cache the decompressed image?

    dispatch_async(dispatch_get_main_queue(), ^{
      block(image, nil);
    });
  }];
}

- (void)cancelDownload:(id)downloadToken
{
  if (downloadToken) {
    dispatch_block_t block = (id)downloadToken;
    block();
  }
}

@end
