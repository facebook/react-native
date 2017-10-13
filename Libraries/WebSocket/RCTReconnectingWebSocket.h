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

- (void)webSocketDidOpen:(RCTSRWebSocket *)webSocket;

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message;

- (void)webSocket:(RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;

@end

@interface RCTReconnectingWebSocket : NSObject

- (instancetype)initWithURL:(NSURL *)url;
@property (nonatomic, weak) id<RCTWebSocketProtocolDelegate> delegate;
/** @brief Must be set before -start to have effect */
@property (nonatomic, strong) dispatch_queue_t delegateDispatchQueue;
- (void)send:(id)data;
- (void)start;
- (void)stop;

@end

#endif
