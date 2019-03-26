/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDatePickerManager.h"

#import "RCTBridge.h"
#import "RCTDatePicker.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@implementation RCTConvert(UIDatePicker)

RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)
#else // [TODO(macOS ISS#2323203)
@implementation RCTConvert(NSDatePicker)
RCT_ENUM_CONVERTER(NSDatePickerMode, (@{
  @"single": @(NSSingleDateMode),
  @"range": @(NSRangeDateMode)
}), NSSingleDateMode, unsignedIntegerValue)
RCT_ENUM_CONVERTER(NSDatePickerStyle, (@{
  @"textfield-stepper": @(NSTextFieldAndStepperDatePickerStyle),
  @"clock-calendar": @(NSClockAndCalendarDatePickerStyle),
  @"textfield": @(NSTextFieldDatePickerStyle)
}), NSTextFieldAndStepperDatePickerStyle, unsignedIntegerValue)
#endif // ]TODO(macOS ISS#2323203)

@end

@implementation RCTDatePickerManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // TODO(macOS ISS#2323203)
{
  return [RCTDatePicker new];
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)
#else // [TODO(macOS ISS#2323203)
RCT_REMAP_VIEW_PROPERTY(date, dateValue, NSDate)
RCT_REMAP_VIEW_PROPERTY(minimumDate, minDate, NSDate)
RCT_REMAP_VIEW_PROPERTY(maximumDate, maxDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, NSDatePickerMode)
RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)
RCT_REMAP_VIEW_PROPERTY(pickerStyle, datePickerStyle, NSDatePickerStyle)
#endif // ]TODO(macOS ISS#2323203)

@end
