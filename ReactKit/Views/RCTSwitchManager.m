// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTSwitchManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTSwitch.h"
#import "UIView+ReactKit.h"

@implementation RCTSwitchManager

- (UIView *)view
{
  RCTSwitch *switcher = [[RCTSwitch alloc] init];
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    [self.bridge.eventDispatcher sendInputEventWithName:@"topChange" body:@{
       @"target": sender.reactTag,
       @"value": @(sender.on)
     }];

    sender.wasOn = sender.on;
  }
}

RCT_EXPORT_VIEW_PROPERTY(onTintColor);
RCT_EXPORT_VIEW_PROPERTY(tintColor);
RCT_EXPORT_VIEW_PROPERTY(thumbTintColor);
RCT_EXPORT_VIEW_PROPERTY(on);
RCT_EXPORT_VIEW_PROPERTY(enabled);

@end
