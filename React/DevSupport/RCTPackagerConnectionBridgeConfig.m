/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPackagerConnectionBridgeConfig.h"

#import <React/RCTBridge.h>

#import "RCTJSEnvironment.h"
#import "RCTReloadPackagerMethod.h"
#import "RCTSamplingProfilerPackagerMethod.h"

#if RCT_DEV // Only supported in dev mode

@implementation RCTPackagerConnectionBridgeConfig {
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
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

- (NSDictionary<NSString *, id<RCTPackagerClientMethod>> *)defaultPackagerMethods
{
  return @{
           @"reload": [[RCTReloadPackagerMethod alloc] initWithBridge:_bridge],
           @"pokeSamplingProfiler": [[RCTSamplingProfilerPackagerMethod alloc] initWithJSEnvironment:_bridge]
           };
}

@end

#endif
