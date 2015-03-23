// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTabBarManager.h"

#import "RCTBridge.h"
#import "RCTTabBar.h"

@implementation RCTTabBarManager

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[RCTTabBar alloc] initWithEventDispatcher:_bridge.eventDispatcher];
}

@end
