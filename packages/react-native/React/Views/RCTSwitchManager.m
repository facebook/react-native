/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitchManager.h"

#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "RCTSwitch.h"
#import "UIView+React.h"

@implementation RCTSwitchManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // [macOS]
{
  RCTSwitch *switcher = [RCTSwitch new];
#if !TARGET_OS_OSX // [macOS]
  [switcher addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];
#else // [macOS
  [switcher setTarget:self];
  [switcher setAction:@selector(onChange:)];
#endif // macOS]
  return switcher;
}

- (void)onChange:(RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{@"value" : @(sender.on)});
    }
    sender.wasOn = sender.on;
  }
}

RCT_EXPORT_METHOD(setValue : (nonnull NSNumber *)viewTag toValue : (BOOL)value)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTUIView *> *viewRegistry) { // [macOS]
    RCTUIView *view = viewRegistry[viewTag]; // [macOS]

    if ([view isKindOfClass:[RCTSwitch class]]) {
      [(RCTSwitch *)view setOn:value animated:NO];
    } else {
      RCTLogError(@"view type must be RCTUISwitch"); // [macOS]
    }
  }];
}

#if !TARGET_OS_OSX // [macOS]
RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
#endif // [macOS]
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
RCT_REMAP_VIEW_PROPERTY(thumbColor, thumbTintColor, UIColor);
RCT_REMAP_VIEW_PROPERTY(trackColorForFalse, tintColor, UIColor);
RCT_REMAP_VIEW_PROPERTY(trackColorForTrue, onTintColor, UIColor);

@end
