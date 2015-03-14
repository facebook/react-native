// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTBridgeModule.h"

@interface RCTTestModule : NSObject <RCTBridgeModule>

@property (nonatomic, readonly, getter=isDone) BOOL done;

@end
