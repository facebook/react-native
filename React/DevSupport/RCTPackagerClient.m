/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPackagerClient.h"

#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTReconnectingWebSocket.h>
#import <React/RCTSRWebSocket.h>
#import <React/RCTUtils.h>

#import "RCTPackagerClientResponder.h"

#if RCT_DEV // Only supported in dev mode

@interface RCTPackagerClient () <RCTWebSocketProtocolDelegate>
@end

@implementation RCTPackagerClient {
  RCTReconnectingWebSocket *_socket;
  NSMutableDictionary<NSString *, id<RCTPackagerClientMethod>> *_handlers;
}

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _socket = [[RCTReconnectingWebSocket alloc] initWithURL:url];
    _socket.delegate = self;
    _handlers = [NSMutableDictionary new];
  }
  return self;
}

- (void)addHandler:(id<RCTPackagerClientMethod>)handler forMethod:(NSString *)name
{
  _handlers[name] = handler;
}

- (void)start
{
  _socket.delegate = self;
  [_socket start];
}

- (void)stop
{
  [_socket stop];
}

- (BOOL)isSupportedVersion:(NSNumber *)version
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (!_handlers) {
    return;
  }

  NSError *error = nil;
  NSDictionary<NSString *, id> *msg = RCTJSONParse(message, &error);

  if (error) {
    RCTLogError(@"%@ failed to parse message with error %@\n<message>\n%@\n</message>", [self class], error, msg);
    return;
  }

  if (![self isSupportedVersion:msg[@"version"]]) {
    RCTLogError(@"%@ received message with not supported version %@", [self class], msg[@"version"]);
    return;
  }

  id<RCTPackagerClientMethod> methodHandler = _handlers[msg[@"method"]];
  if (!methodHandler) {
    if (msg[@"id"]) {
      NSString *errorMsg = [NSString stringWithFormat:@"%@ no handler found for method %@", [self class], msg[@"method"]];
      RCTLogError(errorMsg, msg[@"method"]);
      [[[RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                               socket:webSocket] respondWithError:errorMsg];
    }
    return; // If it was a broadcast then we ignore it gracefully
  }

  if (msg[@"id"]) {
    [methodHandler handleRequest:msg[@"params"]
                   withResponder:[[RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                                                         socket:webSocket]];
  } else {
    [methodHandler handleNotification:msg[@"params"]];
  }
}
@end

#endif
