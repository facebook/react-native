/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitch.h"

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
#import <QuartzCore/QuartzCore.h>
#endif // ]TODO(macOS ISS#2323203)

#import "RCTEventDispatcher.h"
#import "UIView+React.h"

@implementation RCTSwitch

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.buttonType = NSSwitchButton;
    self.title = @""; // default is "Button"
  }
  return self;
}
#endif

#if !TARGET_OS_OSX // ]TODO(macOS ISS#2323203)
- (void)setOn:(BOOL)on animated:(BOOL)animated {
  _wasOn = on;
  [super setOn:on animated:animated];
}
#endif // [TODO(macOS ISS#2323203)

#if TARGET_OS_OSX

- (BOOL)on
{
  return self.state == NSOnState;
}

- (void)setOn:(BOOL)on
{
  self.state = on ? NSOnState : NSOffState;
}

#endif // ]TODO(macOS ISS#2323203)

@end
