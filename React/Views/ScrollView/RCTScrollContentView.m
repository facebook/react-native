/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentView.h"

#import <React/RCTAssert.h>
#import <React/UIView+React.h>

#import "RCTScrollView.h"

@implementation RCTScrollContentView

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (@available(iOS 14.0, *)) {
    if (@available(iOS 15.0, *)) {
    } else {
      RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview;
      [scrollView updateContentSizeIfNeeded];
    }
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];
  if (@available(iOS 14.0, *)) {
    if (@available(iOS 15.0, *)) {
    } else {
      if (!self.window) {
        return;
      }
    }
  }

  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview;

  if (!scrollView) {
    return;
  }

  RCTAssert([scrollView isKindOfClass:[RCTScrollView class]], @"Unexpected view hierarchy of RCTScrollView component.");

  [scrollView updateContentSizeIfNeeded];
}

@end
