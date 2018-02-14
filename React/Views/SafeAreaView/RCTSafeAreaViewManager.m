/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSafeAreaViewManager.h"

#import "RCTSafeAreaShadowView.h"
#import "RCTSafeAreaView.h"
#import "RCTUIManager.h"

@implementation RCTSafeAreaViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (RCTSafeAreaShadowView *)shadowView
{
  return [RCTSafeAreaShadowView new];
}

@end
