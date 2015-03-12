// Copyright 2004-present Facebook. All Rights Reserved.

#import <SystemConfiguration/SystemConfiguration.h>

#import "RCTBridgeModule.h"

@interface RCTReachability : NSObject<RCTBridgeModule>

- (instancetype)initWithHost:(NSString *)host NS_DESIGNATED_INITIALIZER;

@end
