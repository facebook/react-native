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
#import "RCTSlider.h"
#import "UIView+React.h"

@implementation RCTSliderManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTSlider *slider = [[RCTSlider alloc] init];
  [slider addTarget:self action:@selector(sliderValueChanged:) forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchEnd:) forControlEvents:UIControlEventTouchUpInside];
  return slider;
}

static void RCTSendSliderEvent(RCTSliderManager *self, UISlider *sender, BOOL continuous)
{
  NSDictionary *event = @{
    @"target": sender.reactTag,
    @"value": @(sender.value),
    @"continuous": @(continuous),
  };

  [self.bridge.eventDispatcher sendInputEventWithName:@"topChange" body:event];
}

- (void)sliderValueChanged:(UISlider *)sender
{
  RCTSendSliderEvent(self, sender, YES);
}

- (void)sliderTouchEnd:(UISlider *)sender
{
  RCTSendSliderEvent(self, sender, NO);
}

RCT_EXPORT_VIEW_PROPERTY(value, float);
RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);

@end
