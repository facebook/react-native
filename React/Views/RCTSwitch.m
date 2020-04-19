/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitch.h"

#import "RCTEventDispatcher.h"
#import "UIView+React.h"

@implementation RCTSwitch

- (void)setOn:(BOOL)on animated:(BOOL)animated
{
  _wasOn = on;
  [super setOn:on animated:animated];
}

@end
