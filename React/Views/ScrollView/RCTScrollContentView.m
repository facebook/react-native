/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview;
#else // [TODO(macOS GH#774)
  // macOS also has a NSClipView in its hierarchy
  RCTScrollView *scrollView = (RCTScrollView *)self.superview.superview.superview;
#endif // ]TODO(macOS GH#774)

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
    CGFloat horizontalScrollerHeight = [platformScrollView hasHorizontalScroller] ? NSHeight([[platformScrollView horizontalScroller] frame]) : 0;
    CGFloat verticalScrollerWidth = [platformScrollView hasVerticalScroller] ? NSWidth([[platformScrollView verticalScroller] frame]) : 0;

    RCTScrollContentLocalData *localData =
      [[RCTScrollContentLocalData alloc]
      initWithVerticalScrollerWidth:horizontalScrollerHeight
           horizontalScrollerHeight:verticalScrollerWidth];
    [[[scrollView bridge] uiManager] setLocalData:localData forView:self];
  }

  if ([platformScrollView accessibilityRole] == NSAccessibilityTableRole) {
      NSMutableArray *subViews = [[NSMutableArray alloc] initWithCapacity:[[self subviews] count]];
      for (NSView *view in [self subviews]) {
          if ([view isKindOfClass:[RCTView class]]) {
            [subViews addObject:view];
          }
      }

      [platformScrollView setAccessibilityRows:subViews];
  }

#endif // ]TODO(macOS GH#774)
}

@end
