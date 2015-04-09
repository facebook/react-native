/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPickerManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTPicker.h"

@implementation RCTPickerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTPicker alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(items, NSDictionaryArray)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)

- (NSDictionary *)constantsToExport
{
  RCTPicker *pv = [[RCTPicker alloc] init];
  return @{
    @"ComponentHeight": @(CGRectGetHeight(pv.frame)),
    @"ComponentWidth": @(CGRectGetWidth(pv.frame))
  };
}

@end
