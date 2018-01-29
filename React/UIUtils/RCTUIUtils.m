/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUIUtils.h"

RCTDimensions RCTGetDimensions(CGFloat fontScale)
{
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;
  RCTDimensions result;
  typeof (result.window) dims = {
    .width = screenSize.width,
    .height = screenSize.height,
    .scale = mainScreen.scale,
    .fontScale = fontScale
  };
  result.window = dims;
  result.screen = dims;

  return result;
}

CGFloat RCTGetMultiplierForContentSizeCategory(UIContentSizeCategory category)
{
  static NSDictionary<NSString *, NSNumber *> *multipliers = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    multipliers = @{
        UIContentSizeCategoryExtraSmall: @0.823,
        UIContentSizeCategorySmall: @0.882,
        UIContentSizeCategoryMedium: @0.941,
        UIContentSizeCategoryLarge: @1.0,
        UIContentSizeCategoryExtraLarge: @1.118,
        UIContentSizeCategoryExtraExtraLarge: @1.235,
        UIContentSizeCategoryExtraExtraExtraLarge: @1.353,
        UIContentSizeCategoryAccessibilityMedium: @1.786,
        UIContentSizeCategoryAccessibilityLarge: @2.143,
        UIContentSizeCategoryAccessibilityExtraLarge: @2.643,
        UIContentSizeCategoryAccessibilityExtraExtraLarge: @3.143,
        UIContentSizeCategoryAccessibilityExtraExtraExtraLarge: @3.571
    };
  });

  double value = multipliers[category].doubleValue;
  return value > 0.0 ? value : 1.0;
}
