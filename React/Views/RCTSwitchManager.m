/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSwitchManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTSwitch.h"
#import "UIView+React.h"

@implementation RCTSwitchManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTSwitch *switcher = [RCTSwitch new];
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    [self.bridge.eventDispatcher sendInputEventWithName:@"change" body:@{
       @"target": sender.reactTag,
       @"value": @(sender.on)
     }];

    sender.wasOn = sender.on;
  }
}

RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, RCTSwitch)
{
  if (json) {
    view.enabled = !([RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end
