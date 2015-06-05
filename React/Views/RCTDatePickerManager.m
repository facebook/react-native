/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDatePickerManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"

@implementation RCTConvert(UIDatePicker)

RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation RCTDatePickerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  // TODO: we crash here if the RCTDatePickerManager is released
  // while the UIDatePicker is still sending onChange events. To
  // fix this we should maybe subclass UIDatePicker and make it
  // be its own event target.
  UIDatePicker *picker = [[UIDatePicker alloc] init];
  [picker addTarget:self action:@selector(onChange:)
   forControlEvents:UIControlEventValueChanged];
  return picker;
}

RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

- (void)onChange:(UIDatePicker *)sender
{
  NSDictionary *event = @{
    @"target": sender.reactTag,
    @"timestamp": @([sender.date timeIntervalSince1970] * 1000.0)
  };
  [self.bridge.eventDispatcher sendInputEventWithName:@"topChange" body:event];
}

- (NSDictionary *)constantsToExport
{
  UIDatePicker *view = [[UIDatePicker alloc] init];
  return @{
    @"ComponentHeight": @(view.intrinsicContentSize.height),
    @"ComponentWidth": @(view.intrinsicContentSize.width),
  };
}

@end
