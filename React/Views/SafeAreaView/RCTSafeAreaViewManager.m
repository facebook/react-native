/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaViewManager.h"

#import "RCTSafeAreaShadowView.h"
#import "RCTSafeAreaView.h"
#import "RCTUIManager.h"

@implementation RCTSafeAreaViewManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(emulateUnlessSupported, BOOL)

- (UIView *)view
{
  return [[RCTSafeAreaView alloc] initWithBridge:self.bridge];
}

- (RCTSafeAreaShadowView *)shadowView
{
  return [RCTSafeAreaShadowView new];
}

@end
