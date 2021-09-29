/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDatePickerManager.h"

#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "RCTDatePicker.h"
#import "UIView+React.h"

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@implementation RCTConvert (UIDatePicker)

RCT_ENUM_CONVERTER(
    UIDatePickerMode,
    (@{
      @"time" : @(UIDatePickerModeTime),
      @"date" : @(UIDatePickerModeDate),
      @"datetime" : @(UIDatePickerModeDateAndTime),
      @"countdown" : @(UIDatePickerModeCountDownTimer), // not supported yet
    }),
    UIDatePickerModeTime,
    integerValue)
#else // [TODO(macOS GH#774)
@implementation RCTConvert (NSDatePicker)
RCT_ENUM_CONVERTER(NSDatePickerMode, (@{
  @"single": @(NSSingleDateMode),
  @"range": @(NSRangeDateMode)
}), NSSingleDateMode, unsignedIntegerValue)
RCT_ENUM_CONVERTER(NSDatePickerStyle, (@{
  @"textfield-stepper": @(NSTextFieldAndStepperDatePickerStyle),
  @"clock-calendar": @(NSClockAndCalendarDatePickerStyle),
  @"textfield": @(NSTextFieldDatePickerStyle)
}), NSTextFieldAndStepperDatePickerStyle, unsignedIntegerValue)
#endif // ]TODO(macOS GH#774)

@end

@implementation RCTDatePickerManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // TODO(macOS GH#774)
{
  return [RCTDatePicker new];
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)
#else // [TODO(macOS GH#774)
RCT_REMAP_VIEW_PROPERTY(date, dateValue, NSDate)
RCT_REMAP_VIEW_PROPERTY(minimumDate, minDate, NSDate)
RCT_REMAP_VIEW_PROPERTY(maximumDate, maxDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, NSDatePickerMode)
RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)
RCT_REMAP_VIEW_PROPERTY(pickerStyle, datePickerStyle, NSDatePickerStyle)
#endif // ]TODO(macOS GH#774)

RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTPlatformView *> *viewRegistry) { // TODO(macOS GH#774)
    RCTPlatformView *view = viewRegistry[viewTag]; // TODO(macOS GH#774)

    if ([view isKindOfClass:[RCTDatePicker class]]) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
      [(RCTDatePicker *)view setDate:date];
#else // [TODO(macOS GH#774)
      [(RCTDatePicker *)view setDateValue:date];
#endif // ]TODO(macOS GH#774)
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `RCTDatePicker` view is subview of `RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `RCTLegacyViewManagerInteropComponentView`.
      RCTPlatformView *subview = [uiManager viewForReactTag:viewTag].subviews.firstObject; // TODO(macOS GH#774)
      if ([subview isKindOfClass:[RCTDatePicker class]]) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
        [(RCTDatePicker *)subview setDate:date];
#else // [TODO(macOS GH#774)
        [(RCTDatePicker *)subview setDateValue:date];
#endif // ]TODO(macOS GH#774)
      } else {
        RCTLogError(@"view type must be RCTDatePicker");
      }
    }
  }];
}

@end
