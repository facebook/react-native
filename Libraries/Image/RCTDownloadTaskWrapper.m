/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */


#import "RCTDownloadTaskWrapper.h"

#import <objc/runtime.h>

static void *const RCTDownloadTaskWrapperCompletionBlockKey = (void *)&RCTDownloadTaskWrapperCompletionBlockKey;
static void *const RCTDownloadTaskWrapperProgressBlockKey = (void *)&RCTDownloadTaskWrapperProgressBlockKey;

@interface NSURLSessionTask (RCTDownloadTaskWrapper)

@property (nonatomic, copy, setter=rct_setCompletionBlock:) RCTDataCompletionBlock rct_completionBlock;
@property (nonatomic, copy, setter=rct_setProgressBlock:) RCTDataProgressBlock rct_progressBlock;

@end

@implementation NSURLSessionTask (RCTDownloadTaskWrapper)

- (RCTDataCompletionBlock)rct_completionBlock
{
  return objc_getAssociatedObject(self, RCTDownloadTaskWrapperCompletionBlockKey);
}

- (void)rct_setCompletionBlock:(RCTDataCompletionBlock)completionBlock
{
  objc_setAssociatedObject(self, RCTDownloadTaskWrapperCompletionBlockKey, completionBlock, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

- (RCTDataProgressBlock)rct_progressBlock
{
  return objc_getAssociatedObject(self, RCTDownloadTaskWrapperProgressBlockKey);
}

- (void)rct_setProgressBlock:(RCTDataProgressBlock)progressBlock
{
  objc_setAssociatedObject(self, RCTDownloadTaskWrapperProgressBlockKey, progressBlock, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

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
  NSURLSessionDownloadTask *task = [_URLSession downloadTaskWithURL:url completionHandler:nil];
  task.rct_completionBlock = completionBlock;
  task.rct_progressBlock = progressBlock;

  [task resume];
  return task;
}

#pragma mark - NSURLSessionTaskDelegate methods

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  if (downloadTask.rct_completionBlock) {
    NSData *data = [NSData dataWithContentsOfURL:location];
    dispatch_async(dispatch_get_main_queue(), ^{
      downloadTask.rct_completionBlock(downloadTask.response, data, nil);
    });
  }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)didWriteData totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite;
{
  if (downloadTask.rct_progressBlock) {
    dispatch_async(dispatch_get_main_queue(), ^{
      downloadTask.rct_progressBlock(totalBytesWritten, totalBytesExpectedToWrite);
    });
  }
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (error && task.rct_completionBlock) {
    dispatch_async(dispatch_get_main_queue(), ^{
      task.rct_completionBlock(nil, nil, error);
    });
  }
}

@end
