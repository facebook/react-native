// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

#import "RCTExport.h"
#import "RCTInvalidating.h"

@class RCTBridge;

@interface RCTTiming : NSObject <RCTNativeModule, RCTInvalidating>

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end
