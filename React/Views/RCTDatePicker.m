/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDatePicker.h"

#import "RCTUtils.h"
#import "UIView+React.h"

@interface RCTDatePicker ()

@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end

@implementation RCTDatePicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    [self addTarget:self action:@selector(didChange)
               forControlEvents:UIControlEventValueChanged];
#else // [TODO(macOS ISS#2323203)
    self.target = self;
    self.action = @selector(didChange);
#endif // ]TODO(macOS ISS#2323203)
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)didChange
{
  if (_onChange) {
    _onChange(@{ @"timestamp":
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
                   @(self.date.timeIntervalSince1970 * 1000.0)
#else // [TODO(macOS ISS#2323203)
                   @(self.dateValue.timeIntervalSince1970 * 1000.0)
#endif // ]TODO(macOS ISS#2323203)
                 });
  }
}

@end
