/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPackagerClientResponder.h"

#import <React/RCTLog.h>
#import <React/RCTSRWebSocket.h>
#import <React/RCTUtils.h>

#if RCT_DEV // Only supported in dev mode

const int RCT_PACKAGER_CLIENT_PROTOCOL_VERSION = 2;

@implementation RCTPackagerClientResponder {
  id _msgId;
  __weak RCTSRWebSocket *_socket;
}

- (instancetype)initWithId:(id)msgId socket:(RCTSRWebSocket *)socket
{
  if (self = [super init]) {
    _msgId = msgId;
    _socket = socket;
  }
  return self;
}

- (void)respondWithResult:(id)result
{
  NSDictionary<NSString *, id> *msg = @{
                                        @"version": @(RCT_PACKAGER_CLIENT_PROTOCOL_VERSION),
                                        @"id": _msgId,
                                        @"result": result,
                                        };
  NSError *jsError = nil;
  NSString *message = RCTJSONStringify(msg, &jsError);
  if (jsError) {
    RCTLogError(@"%@ failed to stringify message with error %@", [self class], jsError);
  } else {
    [_socket send:message];
  }
}

- (void)respondWithError:(id)error
{
  NSDictionary<NSString *, id> *msg = @{
                                        @"version": @(RCT_PACKAGER_CLIENT_PROTOCOL_VERSION),
                                        @"id": _msgId,
                                        @"error": error,
                                        };
  NSError *jsError = nil;
  NSString *message = RCTJSONStringify(msg, &jsError);
  if (jsError) {
    RCTLogError(@"%@ failed to stringify message with error %@", [self class], jsError);
  } else {
    [_socket send:message];
  }
}
@end

#endif
