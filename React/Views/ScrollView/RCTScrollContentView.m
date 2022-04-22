/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentView.h"

#import <React/RCTAssert.h>
#import <React/UIView+React.h>

#if TARGET_OS_OSX // [TODO(macOS GH#774)
#import <React/RCTUIManager.h>
#import "RCTScrollContentLocalData.h"
#endif // ]TODO(macOS GH#774)

#import "RCTScrollView.h"

@implementation RCTScrollContentView
#if TARGET_OS_OSX // [TODO(macOS GH#774)
{
  BOOL _hasHorizontalScroller;
  BOOL _hasVerticalScroller;
}
#endif // ]TODO(macOS GH#774)

- (void)reactSetFrame:(CGRect)frame
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview;
#else // [TODO(macOS GH#774)
  // macOS also has a NSClipView in its hierarchy
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview.superview;
#endif // ]TODO(macOS GH#774)

  [super reactSetFrame:frame];

  if (!scrollView) {
    return;
  }

  RCTAssert([scrollView isKindOfClass:[RCTScrollView class]], @"Unexpected view hierarchy of RCTScrollView component.");

  [scrollView updateContentSizeIfNeeded];

#if TARGET_OS_OSX // [TODO(macOS GH#774)
  // On macOS scroll indicators may float over the content view like they do in iOS
  // or depending on system preferences they may be outside of the content view
  // which means the clip view will be smaller than the scroll view itself.
  // In such cases the content view layout must shrink accordingly otherwise
  // the contents will overflow causing the scroll indicators to appear unnecessarily.
  NSScrollView *platformScrollView = [scrollView scrollView];
  if ([platformScrollView scrollerStyle] == NSScrollerStyleLegacy) {
    const BOOL nextHasHorizontalScroller = [platformScrollView hasHorizontalScroller];
    const BOOL nextHasVerticalScroller = [platformScrollView hasVerticalScroller];

    if (_hasHorizontalScroller != nextHasHorizontalScroller ||
        _hasVerticalScroller != nextHasVerticalScroller) {

      _hasHorizontalScroller = nextHasHorizontalScroller;
      _hasVerticalScroller = nextHasVerticalScroller;

      CGFloat horizontalScrollerHeight = _hasHorizontalScroller ? NSHeight([[platformScrollView horizontalScroller] frame]) : 0;
      CGFloat verticalScrollerWidth = _hasVerticalScroller ? NSWidth([[platformScrollView verticalScroller] frame]) : 0;

      RCTScrollContentLocalData *localData =
        [[RCTScrollContentLocalData alloc]
          initWithVerticalScrollerWidth:horizontalScrollerHeight
               horizontalScrollerHeight:verticalScrollerWidth];
      [[[scrollView bridge] uiManager] setLocalData:localData forView:self];
    }
  }
#endif // ]TODO(macOS GH#774)
}

@end
