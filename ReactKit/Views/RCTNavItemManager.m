/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNavItemManager.h"

#import "RCTConvert.h"
#import "RCTNavItem.h"

@implementation RCTNavItemManager

- (UIView *)view
{
  return [[RCTNavItem alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(title)
RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle);
RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle);
RCT_EXPORT_VIEW_PROPERTY(backButtonTitle);
RCT_EXPORT_VIEW_PROPERTY(tintColor);
RCT_EXPORT_VIEW_PROPERTY(barTintColor);
RCT_EXPORT_VIEW_PROPERTY(titleTextColor);

- (void)set_leftButtonImageName:(id)json forView:(RCTNavItem *)view withDefaultView:(RCTNavItem *)defaultView
{
  view.leftButtonImage = json ? [RCTConvert UIImage:json] : defaultView.leftButtonImage;
}

- (void)set_rightButtonImageName:(id)json forView:(RCTNavItem *)view withDefaultView:(RCTNavItem *)defaultView
{
  view.rightButtonImage = json ? [RCTConvert UIImage:json] : defaultView.rightButtonImage;
}

- (void)set_backButtonImageName:(id)json forView:(RCTNavItem *)view withDefaultView:(RCTNavItem *)defaultView
{
  view.backButtonImage = json ? [RCTConvert UIImage:json] : defaultView.backButtonImage;
}

@end

