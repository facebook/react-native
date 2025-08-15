/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWrapperViewManager.h"

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import "RCTWrapperShadowView.h"
#import "RCTWrapperView.h"

@implementation RCTWrapperViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  return [[RCTWrapperShadowView alloc] initWithBridge:self.bridge];
}

- (UIView *)view
{
  return [[RCTWrapperView alloc] initWithBridge:self.bridge];
}

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
