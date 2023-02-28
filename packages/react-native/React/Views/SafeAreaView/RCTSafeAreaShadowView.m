/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaShadowView.h"

#import <React/RCTAssert.h>
#import <yoga/Yoga.h>

#import "RCTSafeAreaViewLocalData.h"

@implementation RCTSafeAreaShadowView

- (void)setLocalData:(RCTSafeAreaViewLocalData *)localData
{
  RCTAssert(
      [localData isKindOfClass:[RCTSafeAreaViewLocalData class]],
      @"Local data object for `RCTSafeAreaShadowView` must be `RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (YGValue){insets.left, YGUnitPoint};
  super.paddingRight = (YGValue){insets.right, YGUnitPoint};
  super.paddingTop = (YGValue){insets.top, YGUnitPoint};
  super.paddingBottom = (YGValue){insets.bottom, YGUnitPoint};

  [self didSetProps:@[ @"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom" ]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(__unused YGValue)value
{
}
- (void)setPaddingLeft:(__unused YGValue)value
{
}
- (void)setPaddingRight:(__unused YGValue)value
{
}
- (void)setPaddingTop:(__unused YGValue)value
{
}
- (void)setPaddingBottom:(__unused YGValue)value
{
}

@end
