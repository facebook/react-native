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

@interface NSObject (RCTDownloadTaskWrapper)

@property (nonatomic, copy) RCTDataCompletionBlock reactCompletionBlock;
@property (nonatomic, copy) RCTDataProgressBlock reactProgressBlock;

@end

@implementation NSObject (RCTDownloadTaskWrapper)

- (RCTDataCompletionBlock)reactCompletionBlock
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactCompletionBlock:(RCTDataCompletionBlock)completionBlock
{
  objc_setAssociatedObject(self, @selector(reactCompletionBlock), completionBlock, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

- (RCTDataProgressBlock)reactProgressBlock
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactProgressBlock:(RCTDataProgressBlock)progressBlock
{
  objc_setAssociatedObject(self, @selector(reactProgressBlock), progressBlock, OBJC_ASSOCIATION_COPY_NONATOMIC);
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
  NSURLSessionDownloadTask *task = [_URLSession downloadTaskWithURL:url];
  task.reactCompletionBlock = completionBlock;
  task.reactProgressBlock = progressBlock;
  return task;
}

#pragma mark - NSURLSessionTaskDelegate methods

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  if (downloadTask.reactCompletionBlock) {
    NSData *data = [NSData dataWithContentsOfURL:location];
    dispatch_async(dispatch_get_main_queue(), ^{
      downloadTask.reactCompletionBlock(downloadTask.response, data, nil);
    });
  }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)didWriteData totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite;
{
  if (downloadTask.reactProgressBlock) {
    dispatch_async(dispatch_get_main_queue(), ^{
      downloadTask.reactProgressBlock(totalBytesWritten, totalBytesExpectedToWrite);
    });
  }
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (error && task.reactCompletionBlock) {
    dispatch_async(dispatch_get_main_queue(), ^{
      task.reactCompletionBlock(nil, nil, error);
    });
  }
}

@end
