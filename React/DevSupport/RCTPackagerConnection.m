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
#import <React/RCTWebSocketObserverProtocol.h>

#import "RCTPackagerClient.h"
#import "RCTReloadPackagerMethod.h"
#import "RCTSamplingProfilerPackagerMethod.h"

#if RCT_DEV

@implementation RCTPackagerConnection {
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
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
  static NSMutableDictionary<NSString *, RCTPackagerClient *> *jsPackagerClients = nil;
  if (jsPackagerClients == nil) {
    jsPackagerClients = [NSMutableDictionary new];
  }

  NSString *key = [url absoluteString];
  RCTPackagerClient *packagerClient = jsPackagerClients[key];
  if (!packagerClient) {
    packagerClient = [[RCTPackagerClient alloc] initWithURL:url];
    jsPackagerClients[key] = packagerClient;
  } else {
    [packagerClient stop];
  }

  [packagerClient addHandler:[[RCTReloadPackagerMethod alloc] initWithBridge:_bridge]
                   forMethod:@"reload"];
  [packagerClient addHandler:[[RCTSamplingProfilerPackagerMethod alloc] initWithBridge:_bridge]
                   forMethod:@"pokeSamplingProfiler"];
  [packagerClient start];
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

@end

#endif
