/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDataRequestHandler.h>
#import <ReactCommon/RCTTurboModule.h>

#import <mutex>

#import "RCTNetworkPlugins.h"

@interface RCTDataRequestHandler () <RCTTurboModule>
@end

@implementation RCTDataRequestHandler {
  NSOperationQueue *_queue;
  std::mutex _operationHandlerMutexLock;
}

RCT_EXPORT_MODULE()

- (void)invalidate
{
  std::lock_guard<std::mutex> lock(_operationHandlerMutexLock);
  if (_queue) {
    for (NSOperation *operation in _queue.operations) {
      if (!operation.isCancelled && !operation.isFinished) {
        [operation cancel];
      }
    }
    _queue = nil;
  }
}

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [request.URL.scheme caseInsensitiveCompare:@"data"] == NSOrderedSame;
}

- (NSOperation *)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  std::lock_guard<std::mutex> lock(_operationHandlerMutexLock);
  // Lazy setup
  if (!_queue) {
    _queue = [NSOperationQueue new];
    _queue.maxConcurrentOperationCount = 2;
  }

  __weak __block NSBlockOperation *weakOp;
  __block NSBlockOperation *op = [NSBlockOperation blockOperationWithBlock:^{
    // Get mime type
    NSRange firstSemicolon = [request.URL.resourceSpecifier rangeOfString:@";"];
    NSString *mimeType =
        firstSemicolon.length ? [request.URL.resourceSpecifier substringToIndex:firstSemicolon.location] : nil;

    // Send response
    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:mimeType
                                           expectedContentLength:-1
                                                textEncodingName:nil];

    [delegate URLRequest:weakOp didReceiveResponse:response];

    // Load data
    NSError *error;
    NSData *data = [NSData dataWithContentsOfURL:request.URL options:NSDataReadingMappedIfSafe error:&error];
    if (data) {
      [delegate URLRequest:weakOp didReceiveData:data];
    }
    [delegate URLRequest:weakOp didCompleteWithError:error];
  }];

  weakOp = op;
  [_queue addOperation:op];
  return op;
}

- (void)cancelRequest:(NSOperation *)op
{
  std::lock_guard<std::mutex> lock(_operationHandlerMutexLock);
  if (!op.isCancelled && !op.isFinished) {
    [op cancel];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class RCTDataRequestHandlerCls(void)
{
  return RCTDataRequestHandler.class;
}
