/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

@protocol RCTInspectorPackagerConnectionProtocol <NSObject>
- (instancetype)initWithURL:(NSURL *)url;

- (bool)isConnected;
- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
@end

@interface RCTInspectorPackagerConnection : NSObject <RCTInspectorPackagerConnectionProtocol>
@end

@interface RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
