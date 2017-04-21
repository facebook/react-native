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

@class RCTSRWebSocket;

@protocol RCTWebSocketProtocolDelegate

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message;

@end

@interface RCTReconnectingWebSocket : NSObject

- (instancetype)initWithURL:(NSURL *)url;
@property (nonatomic, weak) id<RCTWebSocketProtocolDelegate> delegate;
- (void)send:(id)data;
- (void)start;
- (void)stop;

@end

#endif
