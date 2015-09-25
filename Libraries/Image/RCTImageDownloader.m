/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageDownloader.h"

#import "RCTGIFImage.h"
#import "RCTImageUtils.h"
#import "RCTLog.h"
#import "RCTNetworking.h"
#import "RCTUtils.h"

CGSize RCTTargetSizeForClipRect(CGRect);
CGRect RCTClipRect(CGSize, CGFloat, CGSize, CGFloat, UIViewContentMode);

static NSURLCache *_sharedURLCache;
static NSCache *_sharedMemCache;

@implementation RCTImageDownloader
{
  dispatch_queue_t _processingQueue;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (void)initialize {
  [super initialize];
    
  _sharedMemCache = [[NSCache alloc] init];
  _sharedURLCache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024
                                                  diskCapacity:200 * 1024 * 1024
                                                      diskPath:@"React/RCTImageDownloader"];
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

+ (void)setCache:(NSURLCache *)cache {
  _sharedURLCache = cache;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _processingQueue = dispatch_queue_create("com.facebook.React.DownloadProcessingQueue", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

/**
 * Downloads a block of raw data and returns it. Note that the callback block
 * will not be executed on the same thread you called the method from, nor on
 * the main thread. Returns a token that can be used to cancel the download.
 */
- (RCTImageLoaderCancellationBlock)downloadDataForURL:(NSURL *)url
                                        progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                      completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  if (![_bridge respondsToSelector:NSSelectorFromString(@"networking")]) {
    RCTLogError(@"You need to import the RCTNetworking library in order to download remote images.");
    return ^{};
  }

  RCTURLRequestCompletionBlock runBlocks = ^(NSURLResponse *response, NSData *data, NSError *error) {

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
      completionBlock(error, data);
    });
  };

  NSURLRequest *request = [NSURLRequest requestWithURL:url];
  {
    NSCachedURLResponse *cachedResponse = [_sharedURLCache cachedResponseForRequest:request];
    if (cachedResponse) {
      runBlocks(cachedResponse.response, cachedResponse.data, nil);
      return ^{};
    }
  }

  RCTDownloadTask *task = [_bridge.networking downloadTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
    if (response && !error) {
      NSCachedURLResponse *cachedResponse = [[NSCachedURLResponse alloc] initWithResponse:response data:data userInfo:nil storagePolicy:NSURLCacheStorageAllowed];
      [_sharedURLCache storeCachedResponse:cachedResponse forRequest:request];
    }
    runBlocks(response, data, error);
  }];
  if (progressBlock) {
    task.downloadProgressBlock = progressBlock;
  }
  return ^{ [task cancel]; };
}

- (RCTImageLoaderCancellationBlock)downloadImageForURL:(NSURL *)url
                                                  size:(CGSize)size
                                                 scale:(CGFloat)scale
                                            resizeMode:(UIViewContentMode)resizeMode
                                         progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                       completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  UIImage *cachedImage = [_sharedMemCache objectForKey:url];
  if (cachedImage) {
    completionBlock(nil, cachedImage);
    return ^{};
  }

  scale = scale ?: RCTScreenScale();

  return [self downloadDataForURL:url progressBlock:progressBlock completionBlock:^(NSError *error, id data) {

    if (!data || error) {
      completionBlock(error, nil);
      return;
    }

    if ([url.path.lowercaseString hasSuffix:@".gif"]) {
      id image = RCTGIFImageWithData(data);
      if (!image && !error) {
        NSString *errorMessage = [NSString stringWithFormat:@"Unable to load GIF image: %@", url];
        error = RCTErrorWithMessage(errorMessage);
      }
      completionBlock(error, image);
      return;
    }

    UIImage *image = [UIImage imageWithData:data scale:scale];
      
    [_sharedMemCache setObject:image forKey:url];

    if (image && !CGSizeEqualToSize(size, CGSizeZero)) {

      // Get scale and size
      CGRect imageRect = RCTClipRect(image.size, scale, size, scale, resizeMode);
      CGSize destSize = RCTTargetSizeForClipRect(imageRect);

      // Decompress image at required size
      BOOL opaque = !RCTImageHasAlpha(image.CGImage);
      UIGraphicsBeginImageContextWithOptions(destSize, opaque, scale);
      [image drawInRect:imageRect];
      image = UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();
    }

    completionBlock(nil, image);
  }];
}

@end

@implementation RCTBridge (RCTImageDownloader)

- (RCTImageDownloader *)imageDownloader
{
  return self.modules[RCTBridgeModuleNameForClass([RCTImageDownloader class])];
}

@end
