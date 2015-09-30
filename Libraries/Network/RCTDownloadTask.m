/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDownloadTask.h"

#import "RCTAssert.h"

@implementation RCTDownloadTask
{
  NSMutableData *_data;
  id<RCTURLRequestHandler> _handler;
  RCTDownloadTask *_selfReference;
}

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<RCTURLRequestHandler>)handler
                completionBlock:(RCTURLRequestCompletionBlock)completionBlock
{
  RCTAssertParam(request);
  RCTAssertParam(handler);
  RCTAssertParam(completionBlock);

  static NSUInteger requestID = 0;

  if ((self = [super init])) {
    if (!(_requestToken = [handler sendRequest:request withDelegate:self])) {
      return nil;
    }
    _requestID = @(requestID++);
    _request = request;
    _handler = handler;
    _completionBlock = completionBlock;
    _selfReference = self;
  }
  return self;
}

- (void)invalidate
{
  _selfReference = nil;
  _completionBlock = nil;
  _downloadProgressBlock = nil;
  _incrementalDataBlock = nil;
  _responseBlock = nil;
  _uploadProgressBlock = nil;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)cancel
{
  if ([_handler respondsToSelector:@selector(cancelRequest:)]) {
    [_handler cancelRequest:_requestToken];
  }
  [self invalidate];
}

- (BOOL)validateRequestToken:(id)requestToken
{
  if (![requestToken isEqual:_requestToken]) {
    if (RCT_DEBUG) {
      RCTAssert([requestToken isEqual:_requestToken],
                @"Unrecognized request token: %@", requestToken);
    }
    if (_completionBlock) {
      _completionBlock(_response, _data, [NSError errorWithDomain:RCTErrorDomain code:0
        userInfo:@{NSLocalizedDescriptionKey: @"Unrecognized request token."}]);
      [self invalidate];
    }
    return NO;
  }
  return YES;
}

- (void)URLRequest:(id)requestToken didSendDataWithProgress:(int64_t)bytesSent
{
  if ([self validateRequestToken:requestToken]) {
    if (_uploadProgressBlock) {
      _uploadProgressBlock(bytesSent, _request.HTTPBody.length);
    }
  }
}

- (void)URLRequest:(id)requestToken didReceiveResponse:(NSURLResponse *)response
{
  if ([self validateRequestToken:requestToken]) {
    _response = response;
    if (_responseBlock) {
      _responseBlock(response);
    }
  }
}

- (void)URLRequest:(id)requestToken didReceiveData:(NSData *)data
{
  if ([self validateRequestToken:requestToken]) {
    if (!_data) {
      _data = [NSMutableData new];
    }
    [_data appendData:data];
    if (_incrementalDataBlock) {
      _incrementalDataBlock(data);
    }
    if (_downloadProgressBlock && _response.expectedContentLength > 0) {
      _downloadProgressBlock(_data.length, _response.expectedContentLength);
    }
  }
}

- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error
{
  if ([self validateRequestToken:requestToken]) {
    if (_completionBlock) {
      _completionBlock(_response, _data, error);
      [self invalidate];
    }
  }
}

@end
