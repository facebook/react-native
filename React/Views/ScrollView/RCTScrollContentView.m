/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentView.h"

#import <React/RCTAssert.h>
#import <React/UIView+React.h>

#import "RCTScrollView.h"

@implementation RCTScrollContentView

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview;
#else // [TODO(macOS ISS#2323203)
  // macOS also has a NSClipView in its hierarchy
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview.superview;
#endif // ]TODO(macOS ISS#2323203)

  if (!scrollView) {
    return;
  }

  RCTAssert([scrollView isKindOfClass:[RCTScrollView class]],
            @"Unexpected view hierarchy of RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];
}

@end
