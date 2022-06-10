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

- (RCTPlatformView *)view // TODO(macOS GH#774)
{
  RCTSwitch *switcher = [RCTSwitch new];
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [switcher addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];
#else // [TODO(macOS GH#774)
  [switcher setTarget:self];
  [switcher setAction:@selector(onChange:)];
#endif // ]TODO(macOS GH#774)
  return switcher;
}

- (void)onChange:(RCTSwitch *)sender
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{@"value" : @(sender.on)});
    }
    sender.wasOn = sender.on;
  }
#else // [TODO(macOS GH#774)
  sender.onChange(@{ @"value": @(sender.on) });
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(setValue : (nonnull NSNumber *)viewTag toValue : (BOOL)value)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTUIView *> *viewRegistry) { // TODO(macOS ISS#3536887)
    RCTUIView *view = viewRegistry[viewTag]; // TODO(macOS ISS#3536887)

    if ([view isKindOfClass:[RCTSwitch class]]) {
      [(RCTSwitch *)view setOn:value animated:NO];
    } else {
      RCTLogError(@"view type must be UISwitch");
    }
  }];
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
#endif // TODO(macOS GH#774)
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
