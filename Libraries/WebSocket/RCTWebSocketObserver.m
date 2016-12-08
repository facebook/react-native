/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTWebSocketObserver.h"

#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "RCTSRWebSocket.h"

#if RCT_DEV // Only supported in dev mode

@interface RCTWebSocketObserver () <RCTSRWebSocketDelegate>
@end

@implementation RCTWebSocketObserver {
  NSURL *_url;
  RCTSRWebSocket *_socket;
}

@synthesize delegate = _delegate;

- (instancetype)initWithURL:(NSURL *)url
{
  if ((self = [self init])) {
    _url = url;
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
      [_delegate didReceiveWebSocketMessage:msg];
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

#endif
