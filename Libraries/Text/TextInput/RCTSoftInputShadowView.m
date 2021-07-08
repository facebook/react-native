/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSoftInputShadowView.h>

#import <React/RCTUtils.h>

@implementation RCTSoftInputShadowView

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  subview.width = (YGValue) { RCTScreenSize().width, YGUnitPoint };
}

@end
