/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDefines.h"

#if RCT_DEV // Only supported in dev mode

#import "RCTWebSocketManager.h"

#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "RCTSRWebSocket.h"

#pragma mark - RCTWebSocketObserver

@interface RCTWebSocketObserver : NSObject <RCTSRWebSocketDelegate> {
  NSURL *_url;
}

@property (nonatomic, strong) RCTSRWebSocket *socket;
@property (nonatomic, weak) id<RCTWebSocketProxyDelegate> delegate;
@property (nonatomic, strong) dispatch_semaphore_t socketOpenSemaphore;

- (instancetype)initWithURL:(NSURL *)url delegate:(id<RCTWebSocketProxyDelegate>)delegate;

@end

@implementation RCTWebSocketObserver

- (instancetype)initWithURL:(NSURL *)url delegate:(id<RCTWebSocketProxyDelegate>)delegate
{
  if ((self = [self init])) {
    _url = url;
    _delegate = delegate;
}
  return self;
}

- (void)start
{
  [self stop];
  _socket = [[RCTSRWebSocket alloc] initWithURL:_url];
  _socket.delegate = self;

  [_socket open];
}

- (void)stop
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (_delegate) {
    NSError *error = nil;
    NSDictionary<NSString *, id> *msg = RCTJSONParse(message, &error);

    if (!error) {
      [_delegate socketProxy:[RCTWebSocketManager sharedInstance] didReceiveMessage:msg];
    } else {
      RCTLogError(@"WebSocketManager failed to parse message with error %@\n<message>\n%@\n</message>", error, message);
    }
  }
}

- (void)reconnect
{
  __weak RCTSRWebSocket *socket = _socket;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    // Only reconnect if the observer wasn't stoppped while we were waiting
    if (socket) {
      [self start];
    }
  });
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [self reconnect];
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [self reconnect];
}

@end

#pragma mark - RCTWebSocketManager

@interface RCTWebSocketManager()

@property (nonatomic, strong) NSMutableDictionary *sockets;
@property (nonatomic, strong) dispatch_queue_t queue;

@end

@implementation RCTWebSocketManager

+ (instancetype)sharedInstance
{
  static RCTWebSocketManager *sharedInstance = nil;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
  });

  return sharedInstance;
}

- (void)setDelegate:(id<RCTWebSocketProxyDelegate>)delegate forURL:(NSURL *)url
{
  NSString *key = [url absoluteString];
  RCTWebSocketObserver *observer = _sockets[key];

  if (observer) {
    if (!delegate) {
      [observer stop];
      [_sockets removeObjectForKey:key];
    } else {
      observer.delegate = delegate;
    }
  } else {
    RCTWebSocketObserver *newObserver = [[RCTWebSocketObserver alloc] initWithURL:url delegate:delegate];
    [newObserver start];
    _sockets[key] = newObserver;
  }
}

- (instancetype)init
{
  if ((self = [super init])) {
    _sockets = [NSMutableDictionary new];
    _queue = dispatch_queue_create("com.facebook.react.WebSocketManager", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

@end

#endif
