/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTabBarManager.h"

#import "RCTBridge.h"
#import "RCTTabBar.h"

@implementation RCTTabBarManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTTabBar alloc] initWithEventDispatcher:_bridge.eventDispatcher];
}

@end
