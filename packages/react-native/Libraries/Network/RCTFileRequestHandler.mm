/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTFileRequestHandler.h>

#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>

#import "RCTNetworkPlugins.h"

@interface RCTFileRequestHandler () <RCTTurboModule>
@end

@implementation RCTFileRequestHandler {
  NSOperationQueue *_fileQueue;
}

RCT_EXPORT_MODULE()

- (void)invalidate
{
  [_fileQueue cancelAllOperations];
  _fileQueue = nil;
}

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [request.URL.scheme caseInsensitiveCompare:@"file"] == NSOrderedSame && !RCTIsBundleAssetURL(request.URL);
}

- (NSOperation *)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  // Lazy setup
  if (!_fileQueue) {
    _fileQueue = [NSOperationQueue new];
    _fileQueue.maxConcurrentOperationCount = 4;
  }

  __weak __block NSBlockOperation *weakOp;
  __block NSBlockOperation *op = [NSBlockOperation blockOperationWithBlock:^{
    // Get content length
    NSError *error = nil;
    NSFileManager *fileManager = [NSFileManager new];
    NSDictionary<NSString *, id> *fileAttributes = [fileManager attributesOfItemAtPath:request.URL.path error:&error];
    if (!fileAttributes) {
      [delegate URLRequest:weakOp didCompleteWithError:error];
      return;
    }

    // Get mime type
    NSString *fileExtension = [request.URL pathExtension];
    NSString *contentType = [UTType typeWithFilenameExtension:fileExtension].preferredMIMEType;

    // Send response
    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:contentType
                                           expectedContentLength:[fileAttributes[NSFileSize] ?: @-1 integerValue]
                                                textEncodingName:nil];

    [delegate URLRequest:weakOp didReceiveResponse:response];

    // Load data
    NSData *data = [NSData dataWithContentsOfURL:request.URL options:NSDataReadingMappedIfSafe error:&error];
    if (data) {
      [delegate URLRequest:weakOp didReceiveData:data];
    }
    [delegate URLRequest:weakOp didCompleteWithError:error];
  }];

  weakOp = op;
  [_fileQueue addOperation:op];
  return op;
}

- (void)cancelRequest:(NSOperation *)op
{
  [op cancel];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class RCTFileRequestHandlerCls(void)
{
  return RCTFileRequestHandler.class;
}
