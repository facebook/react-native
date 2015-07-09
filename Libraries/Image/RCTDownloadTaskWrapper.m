/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */


#import "RCTDownloadTaskWrapper.h"

@implementation RCTDownloadTaskWrapper
{
  NSURLSession *_URLSession;
}

- (instancetype)initWithSessionConfiguration:(NSURLSessionConfiguration *)configuration delegateQueue:(NSOperationQueue *)delegateQueue
{
  if ((self = [super init])) {
    _URLSession = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
  }

  return self;
}

- (NSURLSessionDownloadTask *)downloadData:(NSURL *)url progressBlock:(RCTDataProgressBlock)progressBlock completionBlock:(RCTDataCompletionBlock)completionBlock
{
  self.completionBlock = completionBlock;
  self.progressBlock = progressBlock;

  NSURLSessionDownloadTask *task = [_URLSession downloadTaskWithURL:url completionHandler:nil];
  [task resume];
  return task;
}

#pragma mark - NSURLSessionTaskDelegate methods

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  if (self.completionBlock) {
    NSData *data = [NSData dataWithContentsOfURL:location];
    dispatch_async(dispatch_get_main_queue(), ^{
      self.completionBlock(downloadTask.response, data, nil);
    });
  }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)didWriteData totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite;
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self.progressBlock != nil) {
      self.progressBlock(totalBytesWritten, totalBytesExpectedToWrite);
    }
  });
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error
{
  if (error && self.completionBlock) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self.completionBlock(NULL, NULL, error);
    });
  }
}

@end
