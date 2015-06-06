// Copyright 2004-present Facebook. All Rights Reserved.

#import <XCTest/XCTest.h>

#import "RCTConvert.h"

@interface RCTConvert_UIFontTests : XCTestCase

@end

@implementation RCTConvert_UIFontTests

#define RCTAssertEqualFonts(font1, font2) { \
  XCTAssertEqualObjects(font1, font2); \
}

- (void)DISABLED_testWeight // task #7118691
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Medium" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"500"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-UltraLight" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testSize
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:18.5];
    UIFont *result = [RCTConvert UIFont:@{@"fontSize": @18.5}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamily
{
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Cochin"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Italic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testStyle
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Italic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"italic"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)DISABLED_testStyleAndWeight // task #7118691
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-UltraLightItalic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"italic", @"fontWeight": @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-BoldItalic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"italic", @"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)DISABLED_testFamilyAndWeight // task #7118691
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue", @"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Bold", @"fontWeight": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Cochin", @"fontWeight": @"700"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Cochin", @"fontWeight": @"500"}]; // regular Cochin is actually medium bold
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Cochin", @"fontWeight": @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamilyAndStyle
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Italic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue", @"fontStyle": @"italic"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic", @"fontStyle": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)DISABLED_testFamilyStyleAndWeight // task #7118691
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-UltraLightItalic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue", @"fontStyle": @"italic", @"fontWeight": @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic", @"fontStyle": @"normal", @"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic", @"fontStyle": @"normal", @"fontWeight": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

@end
