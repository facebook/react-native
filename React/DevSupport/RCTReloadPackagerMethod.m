/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTReloadPackagerMethod.h"

#import <objc/runtime.h>

#if RCT_DEV // Only supported in dev mode

@implementation RCTReloadPackagerMethod {
  __weak RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)handleRequest:(__unused id)params withResponder:(RCTPackagerClientResponder *)responder
{
  [responder respondWithError:[NSString stringWithFormat: @"%@ does not support onRequest", [self class]]];
}

- (void)handleNotification:(id)params
{
  if (![params isEqual:[NSNull null]] && [params[@"debug"] boolValue]) {
    _bridge.executorClass = objc_lookUpClass("RCTWebSocketExecutor");
  }
  [_bridge reload];
}

@end

#endif
