// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>

#if RCT_DEV

@interface RCTBundleStatus : NSObject
@property (atomic, assign) BOOL isLastBundleDownloadSuccess;
@property (atomic, assign) NSTimeInterval bundleUpdateTimestamp;
@end

typedef RCTBundleStatus *(^RCTBundleStatusProvider)(void);

@interface RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;

- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
- (void)setBundleStatusProvider:(RCTBundleStatusProvider)bundleStatusProvider;
@end

@interface RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
