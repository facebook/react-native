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

@implementation RCTConvert (UITabBar)

RCT_ENUM_CONVERTER(UITabBarItemPositioning, (@{
  @"fill" : @(UITabBarItemPositioningFill),
  @"auto" : @(UITabBarItemPositioningAutomatic),
  @"center" : @(UITabBarItemPositioningCentered)
}), UITabBarItemPositioningAutomatic, integerValue)

@end

@implementation RCTTabBarManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTTabBar new];
}

RCT_EXPORT_VIEW_PROPERTY(unselectedTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
RCT_EXPORT_VIEW_PROPERTY(itemPositioning, UITabBarItemPositioning)
RCT_EXPORT_VIEW_PROPERTY(unselectedItemTintColor, UIColor)

@end
