/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTReloadPackagerMethod.h"

#import "RCTBridge.h"

#if RCT_DEV // Only supported in dev mode

@implementation RCTReloadPackagerMethod {
  RCTReloadPackagerMethodBlock _block;
  dispatch_queue_t _callbackQueue;
}

- (instancetype)initWithReloadCommand:(RCTReloadPackagerMethodBlock)block callbackQueue:(dispatch_queue_t)callbackQueue
{
  if (self = [super init]) {
    _block = [block copy];
    _callbackQueue = callbackQueue;
  }
  return self;
}

- (void)handleRequest:(__unused id)params withResponder:(RCTPackagerClientResponder *)responder
{
  [responder respondWithError:[NSString stringWithFormat: @"%@ does not support onRequest", [self class]]];
}

- (void)handleNotification:(id)params
{
  _block(params);
}

- (dispatch_queue_t)methodQueue
{
  return _callbackQueue;
}

@end

#endif
