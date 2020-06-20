/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentView.h"

#import <React/RCTAssert.h>
#import <React/UIView+React.h>

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
#import <React/RCTUIManager.h>
#import "RCTScrollContentLocalData.h"
#endif // ]TODO(macOS ISS#2323203)

#import "RCTScrollView.h"

@implementation RCTScrollContentView
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
{
  BOOL _hasHorizontalScroller;
  BOOL _hasVerticalScroller;
}
#endif // ]TODO(macOS ISS#2323203)

- (void)reactSetFrame:(CGRect)frame
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview;
#else // [TODO(macOS ISS#2323203)
  // macOS also has a NSClipView in its hierarchy
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview.superview;
#endif // ]TODO(macOS ISS#2323203)

  [super reactSetFrame:frame];

  if (!scrollView) {
    return;
  }

  RCTAssert([scrollView isKindOfClass:[RCTScrollView class]],
            @"Unexpected view hierarchy of RCTScrollView component.");

  [scrollView updateContentOffsetIfNeeded];

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
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

      RCTScrollContentLocalData *localData =
        [[RCTScrollContentLocalData alloc]
          initWithVerticalScroller:[platformScrollView verticalScroller]
                horizontalScroller:[platformScrollView horizontalScroller]];
      [[[scrollView bridge] uiManager] setLocalData:localData forView:self];
    }
  }
#endif // ]TODO(macOS ISS#2323203)
}

@end
