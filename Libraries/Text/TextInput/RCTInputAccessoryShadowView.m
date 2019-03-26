/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInputAccessoryShadowView.h"

#import <React/RCTUtils.h>

@implementation RCTInputAccessoryShadowView

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  subview.width = (YGValue) { RCTScreenSize().width, YGUnitPoint };
}

@end
