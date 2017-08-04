// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>
#import <React/RCTInspector.h>

#if RCT_DEV

@interface RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;
- (void)connect;
- (void)closeQuietly;
- (void)sendOpenEvent:(NSString *)pageId;
@end

@interface RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
