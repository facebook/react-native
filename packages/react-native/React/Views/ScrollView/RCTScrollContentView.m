/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentView.h"

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <React/RCTAssert.h>
#import <React/UIView+React.h>

#import "RCTScrollView.h"

@implementation RCTScrollContentView

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];

  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  RCTAssert([scrollView isKindOfClass:[RCTScrollView class]], @"Unexpected view hierarchy of RCTScrollView component.");

  [scrollView updateContentSizeIfNeeded];
}

@end

#endif // RCT_REMOVE_LEGACY_ARCH
