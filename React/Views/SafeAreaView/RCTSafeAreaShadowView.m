/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSafeAreaShadowView.h"

#import <React/RCTAssert.h>
#import <yoga/Yoga.h>

#import "RCTSafeAreaViewLocalData.h"

@implementation RCTSafeAreaShadowView

- (void)setLocalData:(RCTSafeAreaViewLocalData *)localData
{
  RCTAssert([localData isKindOfClass:[RCTSafeAreaViewLocalData class]],
    @"Local data object for `RCTSafeAreaShadowView` must be `RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (YGValue){insets.left, YGUnitPoint};
  super.paddingRight = (YGValue){insets.right, YGUnitPoint};
  super.paddingTop = (YGValue){insets.top, YGUnitPoint};
  super.paddingBottom = (YGValue){insets.bottom, YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
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
