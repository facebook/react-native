// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTSliderManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "UIView+ReactKit.h"

@implementation RCTSliderManager

- (UIView *)view
{
  UISlider *slider = [[UISlider alloc] init];
  [slider addTarget:self action:@selector(sliderValueChanged:) forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchEnd:) forControlEvents:UIControlEventTouchUpInside];
  return slider;
}

- (void)sliderValueChanged:(UISlider *)sender
{
  NSDictionary *event = @{
    @"target": sender.reactTag,
    @"value": @(sender.value),
    @"continuous": @YES,
  };

  [self.bridge.eventDispatcher sendInputEventWithName:@"topChange" body:event];
}

- (void)sliderTouchEnd:(UISlider *)sender
{
  NSDictionary *event = @{
    @"target": sender.reactTag,
    @"value": @(sender.value),
    @"continuous": @NO,
  };

  [self.bridge.eventDispatcher sendInputEventWithName:@"topChange" body:event];
}

RCT_EXPORT_VIEW_PROPERTY(value);

@end
