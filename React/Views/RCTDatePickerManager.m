/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDatePickerManager.h"

#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "RCTDatePicker.h"
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

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0

RCT_ENUM_CONVERTER(
    UIDatePickerStyle,
    (@{
      @"compact" : @(UIDatePickerStyleCompact),
      @"spinner" : @(UIDatePickerStyleWheels),
      @"inline" : @(UIDatePickerStyleInline),
    }),
    UIDatePickerStyleAutomatic,
    integerValue)
#endif
#pragma clang diagnostic pop
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
      // `RCTDatePicker` view is subview of `RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = [uiManager viewForReactTag:viewTag].subviews.firstObject;
      if ([subview isKindOfClass:[RCTDatePicker class]]) {
        [(RCTDatePicker *)subview setDate:date];
      } else {
        RCTLogError(@"view type must be RCTDatePicker");
      }
    }
  }];
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0
RCT_CUSTOM_VIEW_PROPERTY(pickerStyle, UIDatePickerStyle, RCTDatePicker)
{
  if (@available(iOS 14, *)) {
    // If the style changed, then the date picker may need to be resized and will generate a layout pass to display
    // correctly. We need to prevent that to get consistent layout. That's why we memorise the old frame and set it
    // after style is changed.
    CGRect oldFrame = view.frame;
    if (json) {
      UIDatePickerStyle style = [RCTConvert UIDatePickerStyle:json];
      view.preferredDatePickerStyle = style;
    } else {
      view.preferredDatePickerStyle = UIDatePickerStyleWheels;
    }
    view.frame = oldFrame;
  }
}
#endif
@end
