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
RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle);
RCT_EXPORT_VIEW_PROPERTY(backButtonTitle);
RCT_EXPORT_VIEW_PROPERTY(tintColor);
RCT_EXPORT_VIEW_PROPERTY(barTintColor);
RCT_EXPORT_VIEW_PROPERTY(titleTextColor);

@end

