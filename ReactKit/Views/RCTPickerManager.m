// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTPickerManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTPicker.h"

@implementation RCTPickerManager

- (UIView *)view
{
  return [[RCTPicker alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(items)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex)

- (NSDictionary *)constantsToExport
{
  RCTPicker *pv = [[RCTPicker alloc] init];
  return @{
    @"ComponentHeight": @(CGRectGetHeight(pv.frame)),
    @"ComponentWidth": @(CGRectGetWidth(pv.frame))
  };
}

@end
