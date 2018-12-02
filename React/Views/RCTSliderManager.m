/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
  RCTSlider *slider = [RCTSlider new];
  [slider addTarget:self action:@selector(sliderValueChanged:)
   forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchEnd:)
   forControlEvents:(UIControlEventTouchUpInside |
                     UIControlEventTouchUpOutside |
                     UIControlEventTouchCancel)];
  return slider;
}

static void RCTSendSliderEvent(RCTSlider *sender, BOOL continuous)
{
  float value = sender.value;

  if (sender.step > 0 &&
      sender.step <= (sender.maximumValue - sender.minimumValue)) {

    value =
      MAX(sender.minimumValue,
        MIN(sender.maximumValue,
          sender.minimumValue + round((sender.value - sender.minimumValue) / sender.step) * sender.step
        )
      );

    [sender setValue:value animated:YES];
  }

  if (continuous) {
    if (sender.onValueChange && sender.lastValue != value) {
      sender.onValueChange(@{
        @"value": @(value),
      });
    }
  } else {
    if (sender.onSlidingComplete) {
      sender.onSlidingComplete(@{
        @"value": @(value),
      });
    }
  }

  sender.lastValue = value;
}

- (void)sliderValueChanged:(RCTSlider *)sender
{
  RCTSendSliderEvent(sender, YES);
}

- (void)sliderTouchEnd:(RCTSlider *)sender
{
  RCTSendSliderEvent(sender, NO);
}

RCT_EXPORT_VIEW_PROPERTY(value, float);
RCT_EXPORT_VIEW_PROPERTY(step, float);
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(onValueChange, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onSlidingComplete, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, RCTSlider)
{
  if (json) {
    view.enabled = !([RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end
