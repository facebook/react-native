/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTWebSocketExecutor.h"

#import "RCTLog.h"
#import "RCTUtils.h"
#import "SRWebSocket.h"

typedef void (^WSMessageCallback)(NSError *error, NSDictionary *reply);

@interface RCTWebSocketExecutor () <SRWebSocketDelegate>
@end

@implementation RCTWebSocketExecutor {
  SRWebSocket *_socket;
  NSOperationQueue *_jsQueue;
  NSMutableDictionary *_callbacks;
  dispatch_semaphore_t _socketOpenSemaphore;
  NSMutableDictionary *_injectedObjects;
}

- (instancetype)init
{
  return [self initWithURL:[NSURL URLWithString:@"http://localhost:8081/debugger-proxy"]];
}

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _jsQueue = [[NSOperationQueue alloc] init];
    _jsQueue.maxConcurrentOperationCount = 1;
    _socket = [[SRWebSocket alloc] initWithURL:url];
    _socket.delegate = self;
    _callbacks = [NSMutableDictionary dictionary];
    _injectedObjects = [NSMutableDictionary dictionary];
    [_socket setDelegateOperationQueue:_jsQueue];


    NSURL *startDevToolsURL = [NSURL URLWithString:@"/launch-chrome-devtools" relativeToURL:url];
    [NSURLConnection connectionWithRequest:[NSURLRequest requestWithURL:startDevToolsURL] delegate:nil];

    if (![self connectToProxy]) {
      RCTLogError(@"Connection to %@ timed out. Are you running node proxy?", url);
      [self invalidate];
      return nil;
    }

    NSInteger retries = 3;
    BOOL runtimeIsReady = [self prepareJSRuntime];
    while (!runtimeIsReady && retries > 0) {
      runtimeIsReady = [self prepareJSRuntime];
      retries--;
    }
    if (!runtimeIsReady) {
      RCTLogError(@"Runtime is not ready. Do you have Chrome open?");
      [self invalidate];
      return nil;
    }
  }
  return self;
}

- (BOOL)connectToProxy
{
  _socketOpenSemaphore = dispatch_semaphore_create(0);
  [_socket open];
  long connected = dispatch_semaphore_wait(_socketOpenSemaphore, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 2));
  return connected == 0;
}

- (BOOL)prepareJSRuntime
{
  __block NSError *initError;
  dispatch_semaphore_t s = dispatch_semaphore_create(0);
  [self sendMessage:@{@"method": @"prepareJSRuntime"} waitForReply:^(NSError *error, NSDictionary *reply) {
    initError = error;
    dispatch_semaphore_signal(s);
  }];
  long runtimeIsReady = dispatch_semaphore_wait(s, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC));
  return runtimeIsReady == 0 && initError == nil;
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSError *error = nil;
  NSDictionary *reply = RCTJSONParse(message, &error);
  NSUInteger messageID = [reply[@"replyID"] integerValue];
  WSMessageCallback callback = [_callbacks objectForKey:@(messageID)];
  if (callback) {
    callback(error, reply);
  }
}

- (void)webSocketDidOpen:(SRWebSocket *)webSocket
{
  dispatch_semaphore_signal(_socketOpenSemaphore);
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  RCTLogError(@"WebSocket connection failed with error %@", error);
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{

}

- (void)sendMessage:(NSDictionary *)message waitForReply:(WSMessageCallback)callback
{
  static NSUInteger lastID = 10000;

  [_jsQueue addOperationWithBlock:^{
    if (!self.valid) {
      NSError *error = [NSError errorWithDomain:@"WS" code:1 userInfo:@{NSLocalizedDescriptionKey:@"socket closed"}];
      callback(error, nil);
      return;
    }

    NSUInteger expectedID = lastID++;

    _callbacks[@(expectedID)] = [callback copy];

    NSMutableDictionary *messageWithID = [message mutableCopy];
    messageWithID[@"id"] = @(expectedID);
    [_socket send:RCTJSONStringify(messageWithID, NULL)];
  }];
}

- (void)executeApplicationScript:(NSString *)script sourceURL:(NSURL *)url onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  NSDictionary *message = @{@"method": NSStringFromSelector(_cmd), @"url": [url absoluteString], @"inject": _injectedObjects};
  [self sendMessage:message waitForReply:^(NSError *error, NSDictionary *reply) {
    onComplete(error);
  }];
}

- (void)executeJSCall:(NSString *)name method:(NSString *)method arguments:(NSArray *)arguments callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"callback was missing for exec JS call");
  NSDictionary *message = @{@"method": NSStringFromSelector(_cmd), @"moduleName": name, @"moduleMethod": method, @"arguments": arguments};
  [self sendMessage:message waitForReply:^(NSError *socketError, NSDictionary *reply) {
    if (socketError) {
      onComplete(nil, socketError);
      return;
    }

    NSString *result = reply[@"result"];
    id objcValue = RCTJSONParse(result, NULL);
    onComplete(objcValue, nil);
  }];
}

- (void)injectJSONText:(NSString *)script asGlobalObjectNamed:(NSString *)objectName callback:(RCTJavaScriptCompleteBlock)onComplete
{
  [_jsQueue addOperationWithBlock:^{
    [_injectedObjects setObject:script forKey:objectName];
    onComplete(nil);
  }];
}

- (void)invalidate
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (BOOL)isValid
{
  return _socket != nil && _socket.readyState == SR_OPEN;
}

- (void)dealloc
{
  RCTAssert(!self.valid, @"-invalidate must be called before -dealloc");
}

@end
