/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <mutex>

#import <React/RCTLog.h>
#import <React/RCTNetworkTask.h>
#import <React/RCTUtils.h>

@implementation RCTNetworkTask
{
  NSMutableData *_data;
  id<RCTURLRequestHandler> _handler;
  dispatch_queue_t _callbackQueue;
  std::mutex _mutex;

  RCTNetworkTask *_selfReference;
}

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<RCTURLRequestHandler>)handler
                  callbackQueue:(dispatch_queue_t)callbackQueue
{
  RCTAssertParam(request);
  RCTAssertParam(handler);
  RCTAssertParam(callbackQueue);

  static NSUInteger requestID = 0;

  if ((self = [super init])) {
    _requestID = @(requestID++);
    _request = request;
    _handler = handler;
    _callbackQueue = callbackQueue;
    _status = RCTNetworkTaskPending;

    dispatch_queue_set_specific(callbackQueue, (__bridge void *)self, (__bridge void *)self, NULL);
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)invalidate
{
  _selfReference = nil;
  _completionBlock = nil;
  _downloadProgressBlock = nil;
  _incrementalDataBlock = nil;
  _responseBlock = nil;
  _uploadProgressBlock = nil;
  _requestToken = nil;
}

- (void)dispatchCallback:(dispatch_block_t)callback
{
  if (dispatch_get_specific((__bridge void *)self) == (__bridge void *)self) {
    callback();
  } else {
    dispatch_async(_callbackQueue, callback);
  }
}

- (void)start
{
  if (_status != RCTNetworkTaskPending) {
    RCTLogError(@"RCTNetworkTask was already started or completed");
    return;
  }

  if (_requestToken == nil) {
    id token = [_handler sendRequest:_request withDelegate:self];
    if ([self validateRequestToken:token]) {
      _selfReference = self;
      _status = RCTNetworkTaskInProgress;
    }
  }
}

- (void)cancel
{
  if (_status == RCTNetworkTaskFinished) {
    return;
  }

  _status = RCTNetworkTaskFinished;
  id token = _requestToken;
  if (token && [_handler respondsToSelector:@selector(cancelRequest:)]) {
    [_handler cancelRequest:token];
  }
  [self invalidate];
}

- (BOOL)validateRequestToken:(id)requestToken
{
  BOOL valid = YES;
  if (_requestToken == nil) {
    if (requestToken == nil) {
      if (RCT_DEBUG) {
        RCTLogError(@"Missing request token for request: %@", _request);
      }
      valid = NO;
    }
    _requestToken = requestToken;
  } else if (![requestToken isEqual:_requestToken]) {
    if (RCT_DEBUG) {
      RCTLogError(@"Unrecognized request token: %@ expected: %@", requestToken, _requestToken);
    }
    valid = NO;
  }

  if (!valid) {
    _status = RCTNetworkTaskFinished;
    if (_completionBlock) {
      RCTURLRequestCompletionBlock completionBlock = _completionBlock;
      [self dispatchCallback:^{
        completionBlock(self->_response, nil, RCTErrorWithMessage(@"Invalid request token."));
      }];
    }
    [self invalidate];
  }
  return valid;
}

- (void)URLRequest:(id)requestToken didSendDataWithProgress:(int64_t)bytesSent
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  if (_uploadProgressBlock) {
    RCTURLRequestProgressBlock uploadProgressBlock = _uploadProgressBlock;
    int64_t length = _request.HTTPBody.length;
    [self dispatchCallback:^{
      uploadProgressBlock(bytesSent, length);
    }];
  }
}

- (void)URLRequest:(id)requestToken didReceiveResponse:(NSURLResponse *)response
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  _response = response;
  if (_responseBlock) {
    RCTURLRequestResponseBlock responseBlock = _responseBlock;
    [self dispatchCallback:^{
      responseBlock(response);
    }];
  }
}

- (void)URLRequest:(id)requestToken didReceiveData:(NSData *)data
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  int64_t length = 0;

  {
    // NSData is not thread-safe and this method could be called from different threads as
    // RCTURLRequestHandlers does not provide any guarantee of which thread we are called on.
    std::lock_guard<std::mutex> lock(_mutex);
    if (!_data) {
      _data = [NSMutableData new];
    }
    [_data appendData:data];
    length = _data.length;
  }

  int64_t total = _response.expectedContentLength;

  if (_incrementalDataBlock) {
    RCTURLRequestIncrementalDataBlock incrementalDataBlock = _incrementalDataBlock;
    [self dispatchCallback:^{
      incrementalDataBlock(data, length, total);
    }];
  }
  if (_downloadProgressBlock && total > 0) {
    RCTURLRequestProgressBlock downloadProgressBlock = _downloadProgressBlock;
    [self dispatchCallback:^{
      downloadProgressBlock(length, total);
    }];
  }
}

- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  _status = RCTNetworkTaskFinished;
  if (_completionBlock) {
    RCTURLRequestCompletionBlock completionBlock = _completionBlock;
    NSData *dataCopy = nil;
    {
      std::lock_guard<std::mutex> lock(self->_mutex);
      dataCopy = _data;
      _data = nil;
    }
    [self dispatchCallback:^{
      completionBlock(self->_response, dataCopy, error);
    }];
  }
  [self invalidate];
}

@end
