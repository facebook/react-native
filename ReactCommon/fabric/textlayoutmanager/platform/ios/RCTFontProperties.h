/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, RCTFontStyle) {
  RCTFontStyleUndefined = -1,
  RCTFontStyleNormal,
  RCTFontStyleItalic,
  RCTFontStyleOblique,
};

typedef NS_OPTIONS(NSInteger, RCTFontVariant) {
  RCTFontVariantUndefined = -1,
  RCTFontVariantDefault = 0,
  RCTFontVariantSmallCaps = 1 << 1,
  RCTFontVariantOldstyleNums = 1 << 2,
  RCTFontVariantLiningNums = 1 << 3,
  RCTFontVariantTabularNums = 1 << 4,
  RCTFontVariantProportionalNums = 1 << 5,
};

struct RCTFontProperties {
  NSString *family = nil;
  CGFloat size = NAN;
  UIFontWeight weight = NAN;
  RCTFontStyle style = RCTFontStyleUndefined;
  RCTFontVariant variant = RCTFontVariantUndefined;
  CGFloat sizeMultiplier = NAN;
};

NS_ASSUME_NONNULL_END
