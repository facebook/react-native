/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModalHostViewManager.h"

#import "RCTBridge.h"
#import "RCTModalHostView.h"
#import "RCTTouchHandler.h"

@implementation RCTModalHostViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTModalHostView alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)

@end
