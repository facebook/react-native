/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTabBarItemManager.h"

#import "RCTConvert.h"
#import "RCTTabBarItem.h"

@implementation RCTTabBarItemManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTTabBarItem new];
}

RCT_EXPORT_VIEW_PROPERTY(badge, id /* NSString or NSNumber */)
RCT_EXPORT_VIEW_PROPERTY(renderAsOriginal, BOOL)
RCT_EXPORT_VIEW_PROPERTY(selected, BOOL)
RCT_EXPORT_VIEW_PROPERTY(icon, UIImage)
RCT_EXPORT_VIEW_PROPERTY(selectedIcon, UIImage)
RCT_EXPORT_VIEW_PROPERTY(systemIcon, UITabBarSystemItem)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(badgeColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
RCT_CUSTOM_VIEW_PROPERTY(title, NSString, RCTTabBarItem)
{
  view.barItem.title = json ? [RCTConvert NSString:json] : defaultView.barItem.title;
  view.barItem.imageInsets = view.barItem.title.length ? UIEdgeInsetsZero : (UIEdgeInsets){6, 0, -6, 0};
}

@end
