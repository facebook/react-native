// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTImageDownloader.h"

#import "RCTCache.h"
#import "RCTUtils.h"

// TODO: something a bit more sophisticated

@implementation RCTImageDownloader
{
  RCTCache *_cache;
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
  }
  return self;
}

- (NSString *)cacheKeyForURL:(NSURL *)url
{
  return url.absoluteString;
}

- (id)_downloadDataForURL:(NSURL *)url
                    block:(RCTDataDownloadBlock)block
{
  NSString *cacheKey = [self cacheKeyForURL:url];

  __block BOOL cancelled = NO;
  __block NSURLSessionDataTask *task = nil;
  dispatch_block_t cancel = ^{
    cancelled = YES;
    if (task) {
      [task cancel];
      task = nil;
    }
  };

  if ([_cache hasDataForKey:cacheKey]) {
    [_cache fetchDataForKey:cacheKey completionHandler:^(NSData *data) {
      if (cancelled) return;
      block(data, nil);
    }];
  } else {
    task = [[NSURLSession sharedSession] dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      block(data, error);
    }];

    [task resume];
  }

  return [cancel copy];
}

- (id)downloadDataForURL:(NSURL *)url
                   block:(RCTDataDownloadBlock)block
{
  NSString *cacheKey = [self cacheKeyForURL:url];
  __weak RCTImageDownloader *weakSelf = self;
  return [self _downloadDataForURL:url block:^(NSData *data, NSError *error) {
    RCTImageDownloader *strongSelf = weakSelf;
    [strongSelf->_cache setData:data forKey:cacheKey];

    dispatch_async(dispatch_get_main_queue(), ^{
      block(data, error);
    });
  }];
}

- (id)downloadImageForURL:(NSURL *)url
                     size:(CGSize)size
                    scale:(CGFloat)scale
                    block:(RCTImageDownloadBlock)block
{
  NSString *cacheKey = [self cacheKeyForURL:url];
  __weak RCTImageDownloader *weakSelf = self;
  return [self _downloadDataForURL:url block:^(NSData *data, NSError *error) {
    if (data) {
      UIImage *image = [UIImage imageWithData:data scale:scale];

      if (image) {
        CGSize imageSize = size;
        if (CGSizeEqualToSize(imageSize, CGSizeZero)) {
          imageSize = image.size;
        }

        CGFloat imageScale = scale;
        if (imageScale == 0 || imageScale > image.scale) {
          imageScale = image.scale;
        }

        UIGraphicsBeginImageContextWithOptions(imageSize, NO, imageScale);
        [image drawInRect:(CGRect){{0, 0}, imageSize}];
        image = UIGraphicsGetImageFromCurrentImageContext();
        UIGraphicsEndImageContext();

        RCTImageDownloader *strongSelf = weakSelf;
        [strongSelf->_cache setData:UIImagePNGRepresentation(image) forKey:cacheKey];
      }

      dispatch_async(dispatch_get_main_queue(), ^{
        block(image, nil);
      });
    } else {
      dispatch_async(dispatch_get_main_queue(), ^{
        block(nil, error);
      });
    }
  }];
}

- (void)cancelDownload:(id)downloadToken
{
  if (downloadToken) {
    dispatch_block_t block = downloadToken;
    block();
  }
}

@end
