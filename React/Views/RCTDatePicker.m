/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
    [self addTarget:self action:@selector(didChange) forControlEvents:UIControlEventValueChanged];
    _reactMinuteInterval = 1;

#if RCT_IOS_14_0_SDK_OR_LATER
    if (@available(iOS 14, *)) {
      self.preferredDatePickerStyle = UIDatePickerStyleWheels;
    }
#endif // RCT_IOS_14_0_SDK_OR_LATER
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)didChange
{
  if (_onChange) {
    _onChange(@{@"timestamp" : @(self.date.timeIntervalSince1970 * 1000.0)});
  }
}

- (void)setDatePickerMode:(UIDatePickerMode)datePickerMode
{
  [super setDatePickerMode:datePickerMode];
  // We need to set minuteInterval after setting datePickerMode, otherwise minuteInterval is invalid in time mode.
  self.minuteInterval = _reactMinuteInterval;
}

- (void)setMinuteInterval:(NSInteger)minuteInterval
{
  [super setMinuteInterval:minuteInterval];
  _reactMinuteInterval = minuteInterval;
}

@end
