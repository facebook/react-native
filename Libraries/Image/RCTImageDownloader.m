/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageDownloader.h"

#import "RCTImageLoader.h"
#import "RCTImageUtils.h"
#import "RCTLog.h"
#import "RCTNetworking.h"
#import "RCTUtils.h"

@implementation RCTImageDownloader
{
  NSURLCache *_cache;
  dispatch_queue_t _processingQueue;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _cache = [[NSURLCache alloc] initWithMemoryCapacity:5 * 1024 * 1024 diskCapacity:200 * 1024 * 1024 diskPath:@"React/RCTImageDownloader"];
    _processingQueue = dispatch_queue_create("com.facebook.React.DownloadProcessingQueue", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return [requestURL.scheme.lowercaseString hasPrefix:@"http"];
}

/**
 * Downloads a block of raw data and returns it. Note that the callback block
 * will not be executed on the same thread you called the method from, nor on
 * the main thread. Returns a token that can be used to cancel the download.
 */
- (RCTImageLoaderCancellationBlock)downloadDataForURL:(NSURL *)url
                                      progressHandler:(RCTImageLoaderProgressBlock)progressBlock
                                    completionHandler:(RCTImageLoaderCompletionBlock)completionBlock
{
  if (![_bridge respondsToSelector:NSSelectorFromString(@"networking")]) {
    RCTLogError(@"You need to import the RCTNetworking library in order to download remote images.");
    return ^{};
  }

  __weak RCTImageDownloader *weakSelf = self;
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
    NSCachedURLResponse *cachedResponse = [_cache cachedResponseForRequest:request];
    if (cachedResponse) {
      runBlocks(cachedResponse.response, cachedResponse.data, nil);
      return ^{};
    }
  }

  RCTDownloadTask *task = [_bridge.networking downloadTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
    if (response && !error) {
      RCTImageDownloader *strongSelf = weakSelf;
      NSCachedURLResponse *cachedResponse = [[NSCachedURLResponse alloc] initWithResponse:response data:data userInfo:nil storagePolicy:NSURLCacheStorageAllowed];
      [strongSelf->_cache storeCachedResponse:cachedResponse forRequest:request];
    }
    runBlocks(response, data, error);
  }];
  if (progressBlock) {
    task.downloadProgressBlock = progressBlock;
  }
  return ^{ [task cancel]; };
}

- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(UIViewContentMode)resizeMode
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  __block RCTImageLoaderCancellationBlock decodeCancel = nil;

  __weak RCTImageDownloader *weakSelf = self;
  RCTImageLoaderCancellationBlock downloadCancel = [self downloadDataForURL:imageURL progressHandler:progressHandler completionHandler:^(NSError *error, NSData *imageData) {
    if (error) {
      completionHandler(error, nil);
    } else {
      decodeCancel = [weakSelf.bridge.imageLoader decodeImageData:imageData size:size scale:scale resizeMode:resizeMode completionBlock:completionHandler];
    }
  }];

  return ^{
    downloadCancel();

    if (decodeCancel) {
      decodeCancel();
    }
  };
}

@end

@implementation RCTBridge (RCTImageDownloader)

- (RCTImageDownloader *)imageDownloader
{
  return self.modules[RCTBridgeModuleNameForClass([RCTImageDownloader class])];
}

@end
