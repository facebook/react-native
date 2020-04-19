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
#import "RCTEventDispatcher.h"
#import "UIView+React.h"

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

@end

@implementation RCTDatePickerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTDatePicker new];
}

RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[RCTDatePicker class]]) {
      [(RCTDatePicker *)view setDate:date];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `RCTPicker` view is subview of `RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[RCTDatePicker class]]) {
        [(RCTDatePicker *)subview setDate:date];
      } else {
        RCTLogError(@"view type must be RCTPicker");
      }
    }
  }];
}

@end
