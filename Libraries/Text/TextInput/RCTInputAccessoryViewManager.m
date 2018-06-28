/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInputAccessoryViewManager.h"

#import "RCTInputAccessoryShadowView.h"
#import "RCTInputAccessoryView.h"

@implementation RCTInputAccessoryViewManager

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (UIView *)view
{
  return [[RCTInputAccessoryView alloc] initWithBridge:self.bridge];
}

- (RCTShadowView *)shadowView
{
  return [RCTInputAccessoryShadowView new];
}

RCT_REMAP_VIEW_PROPERTY(backgroundColor, inputAccessoryView.backgroundColor, UIColor)

@end
