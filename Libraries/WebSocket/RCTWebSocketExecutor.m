/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDefines.h"

#if RCT_DEV // Debug executors are only supported in dev mode

#import "RCTWebSocketExecutor.h"

#import "RCTLog.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"
#import "RCTSRWebSocket.h"

typedef void (^RCTWSMessageCallback)(NSError *error, NSDictionary *reply);

@interface RCTWebSocketExecutor () <RCTSRWebSocketDelegate>

@end

@implementation RCTWebSocketExecutor
{
  RCTSRWebSocket *_socket;
  dispatch_queue_t _jsQueue;
  RCTSparseArray *_callbacks;
  dispatch_semaphore_t _socketOpenSemaphore;
  NSMutableDictionary *_injectedObjects;
  NSURL *_url;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  return [self initWithURL:[NSURL URLWithString:@"http://localhost:8081/debugger-proxy"]];
}

- (instancetype)initWithURL:(NSURL *)URL
{
  RCTAssertParam(URL);

  if ((self = [super init])) {
    _url = URL;
  }
  return self;
}

- (void)setUp
{
  _jsQueue = dispatch_queue_create("com.facebook.React.WebSocketExecutor", DISPATCH_QUEUE_SERIAL);
  _socket = [[RCTSRWebSocket alloc] initWithURL:_url];
  _socket.delegate = self;
  _callbacks = [[RCTSparseArray alloc] init];
  _injectedObjects = [[NSMutableDictionary alloc] init];
  [_socket setDelegateDispatchQueue:_jsQueue];

  NSURL *startDevToolsURL = [NSURL URLWithString:@"/launch-chrome-devtools" relativeToURL:_url];
  [NSURLConnection connectionWithRequest:[NSURLRequest requestWithURL:startDevToolsURL] delegate:nil];

  if (![self connectToProxy]) {
    RCTLogError(@"Connection to %@ timed out. Are you running node proxy? If \
                you are running on the device, check if you have the right IP \
                address in `RCTWebSocketExecutor.m`.", _url);
    [self invalidate];
    return;
  }

  NSInteger retries = 3;
  BOOL runtimeIsReady = [self prepareJSRuntime];
  while (!runtimeIsReady && retries > 0) {
    runtimeIsReady = [self prepareJSRuntime];
    retries--;
  }
  if (!runtimeIsReady) {
    RCTLogError(@"Runtime is not ready. Make sure Chrome is running and not "
                "paused on a breakpoint or exception and try reloading again.");
    [self invalidate];
    return;
  }
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
  [self sendMessage:@{@"method": @"prepareJSRuntime"} context:nil waitForReply:^(NSError *error, NSDictionary *reply) {
    initError = error;
    dispatch_semaphore_signal(s);
  }];
  long runtimeIsReady = dispatch_semaphore_wait(s, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC));
  return runtimeIsReady == 0 && initError == nil;
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSError *error = nil;
  NSDictionary *reply = RCTJSONParse(message, &error);
  NSNumber *messageID = reply[@"replyID"];
  RCTWSMessageCallback callback = _callbacks[messageID];
  if (callback) {
    callback(error, reply);
  }
}

- (void)webSocketDidOpen:(RCTSRWebSocket *)webSocket
{
  dispatch_semaphore_signal(_socketOpenSemaphore);
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  RCTLogError(@"WebSocket connection failed with error %@", error);
}

- (void)sendMessage:(NSDictionary *)message context:(NSNumber *)executorID waitForReply:(RCTWSMessageCallback)callback
{
  static NSUInteger lastID = 10000;

  dispatch_async(_jsQueue, ^{
    if (!self.valid) {
      NSError *error = [NSError errorWithDomain:@"WS" code:1 userInfo:@{
        NSLocalizedDescriptionKey: @"socket closed"
      }];
      callback(error, nil);
      return;
    } else if (executorID && ![RCTGetExecutorID(self) isEqualToNumber:executorID]) {
      return;
    }

    NSNumber *expectedID = @(lastID++);
    _callbacks[expectedID] = [callback copy];
    NSMutableDictionary *messageWithID = [message mutableCopy];
    messageWithID[@"id"] = expectedID;
    [_socket send:RCTJSONStringify(messageWithID, NULL)];
  });
}

- (void)executeApplicationScript:(NSString *)script sourceURL:(NSURL *)URL onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  NSDictionary *message = @{@"method": @"executeApplicationScript", @"url": [URL absoluteString], @"inject": _injectedObjects};
  [self sendMessage:message context:nil waitForReply:^(NSError *error, NSDictionary *reply) {
    onComplete(error);
  }];
}

- (void)executeJSCall:(NSString *)name method:(NSString *)method arguments:(NSArray *)arguments context:(NSNumber *)executorID callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"callback was missing for exec JS call");
  NSDictionary *message = @{
    @"method": @"executeJSCall",
    @"moduleName": name,
    @"moduleMethod": method,
    @"arguments": arguments
  };
  [self sendMessage:message context:executorID waitForReply:^(NSError *socketError, NSDictionary *reply) {
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
  dispatch_async(_jsQueue, ^{
    _injectedObjects[objectName] = script;
    onComplete(nil);
  });
}

- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

- (void)executeAsyncBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  dispatch_async(dispatch_get_main_queue(), block);
}

- (void)invalidate
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (BOOL)isValid
{
  return _socket != nil && _socket.readyState == RCTSR_OPEN;
}

- (void)dealloc
{
  RCTAssert(!self.valid, @"-invalidate must be called before -dealloc");
}

@end

#endif
