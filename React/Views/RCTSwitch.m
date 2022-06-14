/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitch.h"

#import "UIView+React.h"

@implementation RCTSwitch

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
