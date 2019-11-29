/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSegmentedControlManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTSegmentedControl.h"

@implementation RCTSegmentedControlManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTSegmentedControl new];
}

RCT_EXPORT_VIEW_PROPERTY(values, NSArray<NSString *>)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)

@end
