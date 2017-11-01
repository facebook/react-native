/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPackagerConnectionBridgeConfig.h"

#import <objc/runtime.h>

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>

#import "RCTJSEnvironment.h"
#import "RCTReloadPackagerMethod.h"
#import "RCTSamplingProfilerPackagerMethod.h"

#if RCT_DEV // Only supported in dev mode

@implementation RCTPackagerConnectionBridgeConfig {
  id<RCTJSEnvironment> _jsEnvironment;
  RCTReloadPackagerMethodBlock _reloadCommand;
  NSURL *_sourceURL;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _jsEnvironment = bridge;
    _sourceURL = [bridge.bundleURL copy];
    __weak RCTBridge *weakBridge = bridge;
    _reloadCommand = ^(id params) {
      if (params != (id)kCFNull && [params[@"debug"] boolValue]) {
        weakBridge.executorClass = objc_lookUpClass("RCTWebSocketExecutor");
      }
      [weakBridge reload];
    };
  }
  return self;
}

- (NSURL *)packagerURL
{
  NSURLComponents *components = [NSURLComponents new];
  NSString *host = [_sourceURL host];
  components.host = host ?: @"localhost";
  components.scheme = host ? [_sourceURL scheme] : @"http";
  components.port = [_sourceURL port] ?: @(kRCTBundleURLProviderDefaultPort);
  components.path = @"/message";
  components.queryItems = @[[NSURLQueryItem queryItemWithName:@"role" value:@"ios-rn-rctdevmenu"]];
  return components.URL;
}

- (NSDictionary<NSString *, id<RCTPackagerClientMethod>> *)defaultPackagerMethods
{
  return @{
           @"reload": [[RCTReloadPackagerMethod alloc] initWithReloadCommand:_reloadCommand callbackQueue:dispatch_get_main_queue()],
           @"pokeSamplingProfiler": [[RCTSamplingProfilerPackagerMethod alloc] initWithJSEnvironment:_jsEnvironment]
           };
}

@end

#endif
