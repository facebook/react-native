/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaShadowView.h"

#import <React/RCTAssert.h>
#import <yoga/Yoga.h>

#import "RCTSafeAreaViewLocalData.h"
#import "RCTI18nUtil.h"

@implementation RCTSafeAreaShadowView

- (void)setLocalData:(RCTSafeAreaViewLocalData *)localData
{
  RCTAssert([localData isKindOfClass:[RCTSafeAreaViewLocalData class]],
    @"Local data object for `RCTSafeAreaShadowView` must be `RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingTop = (YGValue){insets.top, YGUnitPoint};
  super.paddingBottom = (YGValue){insets.bottom, YGUnitPoint};
  // [TODO(OSS OC#2726827)
  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    if ([[RCTI18nUtil sharedInstance] isRTL]) {
      super.paddingStart = (YGValue){insets.right, YGUnitPoint};
      super.paddingEnd = (YGValue){insets.left, YGUnitPoint};
    } else {
      super.paddingStart = (YGValue){insets.left, YGUnitPoint};
      super.paddingEnd = (YGValue){insets.right, YGUnitPoint};
    }
    [self didSetProps:@[@"paddingStart", @"paddingEnd", @"paddingTop", @"paddingBottom"]];
  } else {
    super.paddingLeft = (YGValue){insets.left, YGUnitPoint};
    super.paddingRight = (YGValue){insets.right, YGUnitPoint};
    [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
  }
  // ]TODO(OSS OC#2726827)
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(YGValue)value {}
- (void)setPaddingLeft:(YGValue)value {}
- (void)setPaddingRight:(YGValue)value {}
- (void)setPaddingTop:(YGValue)value {}
- (void)setPaddingBottom:(YGValue)value {}

@end
