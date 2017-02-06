/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSwitch.h"

#import "RCTEventDispatcher.h"
#import "UIView+React.h"

@implementation RCTSwitch

// `on` is a component prop, so we must expose symmetrical `on` and `setOn` methods.
// UIView breaks convention with the name `isOn`, so we simply forward.
- (BOOL)on {
  return [self isOn];
}

- (void)setOn:(BOOL)on animated:(BOOL)animated {
  _wasOn = on;
  [super setOn:on animated:animated];
}

@end
