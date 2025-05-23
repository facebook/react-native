/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTUtils.h>

@interface RCTUtilsTests : XCTestCase

@end

@implementation RCTUtilsTests

- (void)testRCTFontSizeMultiplierForCategory_UIContentSizeCategoryLarge
{
  CGFloat expected = 1.0f;
  CGFloat actual = RCTFontSizeMultiplierForCategory(UIContentSizeCategoryLarge);
  XCTAssertEqualWithAccuracy(actual, expected, 0.001f, @"Expected multiplier for UIContentSizeCategoryLarge to be %f", expected);
}

- (void)testRCTFontSizeMultiplierForCategory_UIContentSizeCategorySmall
{
  CGFloat expected = 0.882f;
  CGFloat actual = RCTFontSizeMultiplierForCategory(UIContentSizeCategorySmall);
  XCTAssertEqualWithAccuracy(actual, expected, 0.001f, @"Expected multiplier for UIContentSizeCategorySmall to be %f", expected);
}

- (void)testRCTFontSizeMultiplierForCategory_UIContentSizeCategoryAccessibilityExtraExtraExtraLarge
{
  CGFloat expected = 3.571f;
  CGFloat actual = RCTFontSizeMultiplierForCategory(UIContentSizeCategoryAccessibilityExtraExtraExtraLarge);
  XCTAssertEqualWithAccuracy(actual, expected, 0.001f, @"Expected multiplier for UIContentSizeCategoryAccessibilityExtraExtraExtraLarge to be %f", expected);
}

- (void)testRCTFontSizeMultiplierForCategory_NilCategory
{
  CGFloat expected = 1.0f;
  CGFloat actual = RCTFontSizeMultiplierForCategory(nil);
  XCTAssertEqualWithAccuracy(actual, expected, 0.001f, @"Expected multiplier for nil category to be %f", expected);
}

- (void)testRCTFontSizeMultiplierForCategory_UnrecognizedCategory
{
  CGFloat expected = 1.0f;
  CGFloat actual = RCTFontSizeMultiplierForCategory(@"MyInvalidCategory");
  XCTAssertEqualWithAccuracy(actual, expected, 0.001f, @"Expected multiplier for an unrecognized category to be %f", expected);
}

@end
