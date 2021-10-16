/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitch.h"

#if TARGET_OS_OSX // [TODO(macOS GH#774)
#import <QuartzCore/QuartzCore.h>
#endif // ]TODO(macOS GH#774)

#import "UIView+React.h"

@implementation RCTSwitch

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.buttonType = NSButtonTypeSwitch;
    self.title = @""; // default is "Button"
  }
  return self;
}
#endif

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)setOn:(BOOL)on animated:(BOOL)animated
{
  _wasOn = on;
  [super setOn:on animated:animated];
}
#else // [TODO(macOS GH#774)
- (void)setOn:(BOOL)on animated:(BOOL)animated {
  self.state = on ? NSControlStateValueOn : NSControlStateValueOff;
}
#endif // ]TODO(macOS GH#774)

#if TARGET_OS_OSX

- (BOOL)on
{
  return self.state == NSControlStateValueOn;
}

- (void)setOn:(BOOL)on
{
  self.state = on ? NSControlStateValueOn : NSControlStateValueOff;
}

#endif // ]TODO(macOS GH#774)

@end
