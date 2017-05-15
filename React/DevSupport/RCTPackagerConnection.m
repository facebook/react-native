/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPackagerConnection.h"

#import <objc/runtime.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTReconnectingWebSocket.h>
#import <React/RCTSRWebSocket.h>
#import <React/RCTUtils.h>
#import <React/RCTWebSocketObserverProtocol.h>

#import "RCTReloadPackagerMethod.h"
#import "RCTSamplingProfilerPackagerMethod.h"

#if RCT_DEV

@interface RCTPackagerConnection () <RCTWebSocketProtocolDelegate>
@end

@implementation RCTPackagerConnection {
  RCTBridge *_bridge;
  RCTReconnectingWebSocket *_socket;
  NSMutableDictionary<NSString *, id<RCTPackagerClientMethod>> *_handlers;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;

    _handlers = [NSMutableDictionary new];
    _handlers[@"reload"] = [[RCTReloadPackagerMethod alloc] initWithBridge:bridge];
    _handlers[@"pokeSamplingProfiler"] = [[RCTSamplingProfilerPackagerMethod alloc] initWithBridge:bridge];

    [self connect];
  }
  return self;
}

- (void)connect
{
  RCTAssertMainQueue();

  NSURL *url = [self packagerURL];
  if (!url) {
    return;
  }

  // The jsPackagerClient is a static map that holds different packager clients per the packagerURL
  // In case many instances of DevMenu are created, the latest instance that use the same URL as
  // previous instances will override given packager client's method handlers
  static NSMutableDictionary<NSString *, RCTReconnectingWebSocket *> *socketConnections = nil;
  if (socketConnections == nil) {
    socketConnections = [NSMutableDictionary new];
  }

  NSString *key = [url absoluteString];
  RCTReconnectingWebSocket *webSocket = socketConnections[key];
  if (!webSocket) {
    webSocket = [[RCTReconnectingWebSocket alloc] initWithURL:url];
    [webSocket start];
    socketConnections[key] = webSocket;
  }

  webSocket.delegate = self;
}

- (NSURL *)packagerURL
{
  NSString *host = [_bridge.bundleURL host];
  NSString *scheme = [_bridge.bundleURL scheme];
  if (!host) {
    host = @"localhost";
    scheme = @"http";
  }

  NSNumber *port = [_bridge.bundleURL port];
  if (!port) {
    port = @8081; // Packager default port
  }
  return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@:%@/message?role=ios-rn-rctdevmenu", scheme, host, port]];
}


- (void)addHandler:(id<RCTPackagerClientMethod>)handler forMethod:(NSString *)name
{
  _handlers[name] = handler;
}

static BOOL isSupportedVersion(NSNumber *version)
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

#pragma mark - RCTWebSocketProtocolDelegate

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

  if (!isSupportedVersion(msg[@"version"])) {
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
