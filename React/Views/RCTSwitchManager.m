/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitchManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTSwitch.h"
#import "UIView+React.h"

@implementation RCTSwitchManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // TODO(macOS ISS#2323203)
{
  RCTSwitch *switcher = [RCTSwitch new];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
#else // [TODO(macOS ISS#2323203)
  [switcher setTarget:self];
  [switcher setAction:@selector(onChange:)];
#endif // ]TODO(macOS ISS#2323203)
  return switcher;
}

- (void)onChange:(RCTSwitch *)sender
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{ @"value": @(sender.on) });
    }
    sender.wasOn = sender.on;
  }
#else // [TODO(macOS ISS#2323203)
  sender.onChange(@{ @"value": @(sender.on) });
#endif // ]TODO(macOS ISS#2323203)
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
#endif // TODO(macOS ISS#2323203)
RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock);
RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, RCTSwitch)
{
  if (json) {
    view.enabled = !([RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end
