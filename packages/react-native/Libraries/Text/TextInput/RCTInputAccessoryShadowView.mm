/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInputAccessoryShadowView.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTUtils.h>

@implementation RCTInputAccessoryShadowView

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  subview.width = (YGValue){static_cast<float>(RCTScreenSize().width), YGUnitPoint};
}

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
