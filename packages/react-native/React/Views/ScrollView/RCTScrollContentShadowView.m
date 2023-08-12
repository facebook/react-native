/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollContentShadowView.h"

#import <yoga/Yoga.h>

#if TARGET_OS_OSX // [macOS
#import "RCTScrollContentLocalData.h"
#endif // macOS]

#import "RCTUtils.h"

@implementation RCTScrollContentShadowView

#if TARGET_OS_OSX // [macOS
- (void)setLocalData:(RCTScrollContentLocalData *)localData
{
  RCTAssert(
      [localData isKindOfClass:[RCTScrollContentLocalData class]],
      @"Local data object for `RCTScrollContentView` must be `RCTScrollContentLocalData` instance.");

  super.marginEnd = (YGValue){localData.verticalScrollerWidth, YGUnitPoint};
  super.marginBottom = (YGValue){localData.horizontalScrollerHeight, YGUnitPoint};

  [self didSetProps:@[@"marginEnd", @"marginBottom"]];
}
#endif // macOS]

- (void)layoutWithMetrics:(RCTLayoutMetrics)layoutMetrics layoutContext:(RCTLayoutContext)layoutContext
{
  if (layoutMetrics.layoutDirection == UIUserInterfaceLayoutDirectionRightToLeft) {
    // Motivation:
    // Yoga place `contentView` on the right side of `scrollView` when RTL layout is enforced.
    // That breaks everything; it is completely pointless to (re)position `contentView`
    // because it is `contentView`'s job. So, we work around it here.

    layoutContext.absolutePosition.x += layoutMetrics.frame.size.width;
    layoutMetrics.frame.origin.x = 0;
  }

  [super layoutWithMetrics:layoutMetrics layoutContext:layoutContext];
}

@end
