/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInputAccessoryShadowView.h>

#import <React/RCTUtils.h>

@implementation RCTInputAccessoryShadowView

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
#if !TARGET_OS_OSX // [macOS]
  subview.width = (YGValue){RCTScreenSize().width, YGUnitPoint};
#endif // [macOS]
}

@end
