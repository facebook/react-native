/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSliderManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"

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

RCT_EXPORT_VIEW_PROPERTY(value, float);
RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);

@end
