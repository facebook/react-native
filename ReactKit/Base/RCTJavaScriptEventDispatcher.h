// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

@class RCTBridge;

@interface RCTJavaScriptEventDispatcher : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (void)sendDeviceEventWithArgs:(NSArray *)args;
- (void)sendEventWithArgs:(NSArray *)args;
- (void)sendTouchesWithArgs:(NSArray *)args;

@end
