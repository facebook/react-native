/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTDefines.h>

#if RCT_DEV // Only supported in dev mode

@class RCTPackagerClientResponder;
@class RCTSRWebSocket;

extern const int RCT_PACKAGER_CLIENT_PROTOCOL_VERSION;

@protocol RCTPackagerClientMethod

- (void)handleRequest:(id)params withResponder:(RCTPackagerClientResponder *)responder;
- (void)handleNotification:(id)params;

@end

@interface RCTPackagerClientResponder : NSObject

- (instancetype)initWithId:(id)msgId socket:(RCTSRWebSocket *)socket;
- (void)respondWithResult:(id)result;
- (void)respondWithError:(id)error;

@end

#endif
