/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

RCT_EXPORT_VIEW_PROPERTY(values, NSStringArray)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)

RCT_CUSTOM_VIEW_PROPERTY(layerCornerRadius, CGFloat, RCTSegmentedControl) {
  if (json) {
    view.layer.cornerRadius = [RCTConvert CGFloat:json];
  } else {
    view.layer.cornerRadius = defaultView.layer.cornerRadius;
  }
}

- (NSDictionary *)constantsToExport
{
  RCTSegmentedControl *view = [RCTSegmentedControl new];
  return @{
    @"ComponentHeight": @(view.intrinsicContentSize.height),
  };
}

@end
