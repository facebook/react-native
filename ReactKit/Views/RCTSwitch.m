// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTSwitch.h"

#import "RCTEventDispatcher.h"
#import "UIView+ReactKit.h"

@implementation RCTSwitch

- (void)setOn:(BOOL)on animated:(BOOL)animated {
  _wasOn = on;
  [super setOn:on animated:animated];
}

@end
