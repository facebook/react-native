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

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTNavItem new];
}

RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

RCT_EXPORT_VIEW_PROPERTY(title, NSString)
RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)

RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)

RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)

@end
