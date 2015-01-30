// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

#import "RCTExport.h"

@class RCTBridge;

@interface RCTTiming : NSObject <RCTNativeModule>

- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (void)enqueueUpdateTimers;

@end
