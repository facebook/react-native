/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSegmentedControlManager.h"

#import "RCTSegmentedControl.h"

#import "RCTBridge.h"

@implementation RCTSegmentedControlManager

- (UIView *)view
{
  return [[RCTSegmentedControl alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(valuesAndSelectedSegmentIndex, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL);
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL);

@end
