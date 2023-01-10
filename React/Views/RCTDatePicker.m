/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDatePicker.h"

#import <Availability.h>
#import <AvailabilityInternal.h>

#import "RCTUtils.h"
#import "UIView+React.h"

#ifndef __IPHONE_14_0
#define __IPHONE_14_0 140000
#endif // __IPHONE_14_0

#ifndef RCT_IOS_14_0_SDK_OR_LATER
#define RCT_IOS_14_0_SDK_OR_LATER (__IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0)
#endif // RCT_IOS_14_0_SDK_OR_LATER

@interface RCTDatePicker ()

@property (nonatomic, copy) RCTBubblingEventBlock onChange;
@property (nonatomic, assign) NSInteger reactMinuteInterval;

@end

@implementation RCTDatePicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
#if !TARGET_OS_OSX // [macOS]
    [self addTarget:self action:@selector(didChange) forControlEvents:UIControlEventValueChanged];
#else // [macOS
    self.target = self;
    self.action = @selector(didChange);
#endif // macOS]
    _reactMinuteInterval = 1;

#if !TARGET_OS_OSX // [macOS]
#if RCT_IOS_14_0_SDK_OR_LATER
    if (@available(iOS 14, *)) {
      self.preferredDatePickerStyle = UIDatePickerStyleWheels;
    }
#endif // RCT_IOS_14_0_SDK_OR_LATER
#endif // [macOS]
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)didChange
{
  if (_onChange) {
    _onChange(@{ @"timestamp":
#if !TARGET_OS_OSX // [macOS]
                   @(self.date.timeIntervalSince1970 * 1000.0)
#else // [macOS
                   @(self.dateValue.timeIntervalSince1970 * 1000.0)
#endif // macOS]
                 });
  }
}

#if !TARGET_OS_OSX // [macOS]
- (void)setDatePickerMode:(UIDatePickerMode)datePickerMode
{
  [super setDatePickerMode:datePickerMode];
  // We need to set minuteInterval after setting datePickerMode, otherwise minuteInterval is invalid in time mode.
  self.minuteInterval = _reactMinuteInterval;
}
#endif // [macOS]


#if !TARGET_OS_OSX // [macOS]
- (void)setMinuteInterval:(NSInteger)minuteInterval
{
  [super setMinuteInterval:minuteInterval];
  _reactMinuteInterval = minuteInterval;
}
#endif // [macOS]

@end
