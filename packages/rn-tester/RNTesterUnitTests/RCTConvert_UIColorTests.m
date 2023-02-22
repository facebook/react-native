/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTConvert.h>

@interface RCTConvert_NSColorTests : XCTestCase

@end

static BOOL CGColorsAreEqual(CGColorRef color1, CGColorRef color2)
{
  CGFloat rgba1[4];
  CGFloat rgba2[4];
  RCTGetRGBAColorComponents(color1, rgba1);
  RCTGetRGBAColorComponents(color2, rgba2);
  for (int i = 0; i < 4; i++) {
    if (rgba1[i] != rgba2[i]) {
      return NO;
    }
  }
  return YES;
}

@implementation RCTConvert_NSColorTests

- (void)testColor
{
  id json = RCTJSONParse(@"{ \"semantic\": \"lightTextColor\" }", nil);
  UIColor *value = [RCTConvert UIColor:json];
  XCTAssertEqualObjects(value, [UIColor lightTextColor]);
}

- (void)testColorFailure
{
  id json = RCTJSONParse(@"{ \"semantic\": \"bogusColor\" }", nil);

  __block NSString *errorMessage = nil;
  RCTLogFunction defaultLogFunction = RCTGetLogFunction();
  RCTSetLogFunction(
      ^(__unused RCTLogLevel level,
        __unused RCTLogSource source,
        __unused NSString *fileName,
        __unused NSNumber *lineNumber,
        NSString *message) {
        errorMessage = message;
      });

  UIColor *value = [RCTConvert UIColor:json];

  RCTSetLogFunction(defaultLogFunction);

  XCTAssertEqualObjects(value, nil);
  XCTAssertTrue(
      [errorMessage containsString:@"labelColor"]); // the RedBox message will contain a list of the valid color names.
}

- (void)testFallbackColor
{
  id json = RCTJSONParse(@"{ \"semantic\": \"unitTestFallbackColorIOS\" }", nil);
  UIColor *value = [RCTConvert UIColor:json];
  XCTAssertTrue(CGColorsAreEqual([value CGColor], [[UIColor blueColor] CGColor]));
}

- (void)testDynamicColor
{
  // 0        == 0x00000000 == black
  // 16777215 == 0x00FFFFFF == white
  id json = RCTJSONParse(@"{ \"dynamic\": { \"light\":0, \"dark\":16777215 } }", nil);
  UIColor *value = [RCTConvert UIColor:json];
  XCTAssertNotNil(value);

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    id savedTraitCollection = [UITraitCollection currentTraitCollection];

    [UITraitCollection
        setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleLight]];
    CGFloat rgba[4];
    RCTGetRGBAColorComponents([value CGColor], rgba);
    XCTAssertEqual(rgba[0], 0);
    XCTAssertEqual(rgba[1], 0);
    XCTAssertEqual(rgba[2], 0);
    XCTAssertEqual(rgba[3], 0);

    [UITraitCollection
        setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleDark]];
    RCTGetRGBAColorComponents([value CGColor], rgba);
    XCTAssertEqual(rgba[0], 1);
    XCTAssertEqual(rgba[1], 1);
    XCTAssertEqual(rgba[2], 1);
    XCTAssertEqual(rgba[3], 0);

    [UITraitCollection setCurrentTraitCollection:savedTraitCollection];
  }
#endif
}

- (void)testCompositeDynamicColor
{
  id json = RCTJSONParse(
      @"{ \"dynamic\": { \"light\": { \"semantic\": \"systemRedColor\" }, \"dark\":{ \"semantic\": \"systemBlueColor\" } } }",
      nil);
  UIColor *value = [RCTConvert UIColor:json];
  XCTAssertNotNil(value);

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    id savedTraitCollection = [UITraitCollection currentTraitCollection];

    [UITraitCollection
        setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleLight]];

    XCTAssertTrue(CGColorsAreEqual([value CGColor], [[UIColor systemRedColor] CGColor]));

    [UITraitCollection
        setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleDark]];

    XCTAssertTrue(CGColorsAreEqual([value CGColor], [[UIColor systemBlueColor] CGColor]));

    [UITraitCollection setCurrentTraitCollection:savedTraitCollection];
  }
#endif
}

- (void)testGenerateFallbacks
{
  NSDictionary<NSString *, NSNumber *> *semanticColors = @{
    // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
    // Label Colors
    @"labelColor" : @(0xFF000000),
    @"secondaryLabelColor" : @(0x993c3c43),
    @"tertiaryLabelColor" : @(0x4c3c3c43),
    @"quaternaryLabelColor" : @(0x2d3c3c43),
    // Fill Colors
    @"systemFillColor" : @(0x33787880),
    @"secondarySystemFillColor" : @(0x28787880),
    @"tertiarySystemFillColor" : @(0x1e767680),
    @"quaternarySystemFillColor" : @(0x14747480),
    // Text Colors
    @"placeholderTextColor" : @(0x4c3c3c43),
    // Standard Content Background Colors
    @"systemBackgroundColor" : @(0xFFffffff),
    @"secondarySystemBackgroundColor" : @(0xFFf2f2f7),
    @"tertiarySystemBackgroundColor" : @(0xFFffffff),
    // Grouped Content Background Colors
    @"systemGroupedBackgroundColor" : @(0xFFf2f2f7),
    @"secondarySystemGroupedBackgroundColor" : @(0xFFffffff),
    @"tertiarySystemGroupedBackgroundColor" : @(0xFFf2f2f7),
    // Separator Colors
    @"separatorColor" : @(0x493c3c43),
    @"opaqueSeparatorColor" : @(0xFFc6c6c8),
    // Link Color
    @"linkColor" : @(0xFF007aff),
    // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
    // Adaptable Colors
    @"systemBrownColor" : @(0xFFa2845e),
    @"systemIndigoColor" : @(0xFF5856d6),
    // Adaptable Gray Colors
    @"systemGray2Color" : @(0xFFaeaeb2),
    @"systemGray3Color" : @(0xFFc7c7cc),
    @"systemGray4Color" : @(0xFFd1d1d6),
    @"systemGray5Color" : @(0xFFe5e5ea),
    @"systemGray6Color" : @(0xFFf2f2f7),
    // Clear Color
    @"clearColor" : @(0x00000000),
  };

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  id savedTraitCollection = nil;
  if (@available(iOS 13.0, *)) {
    savedTraitCollection = [UITraitCollection currentTraitCollection];

    [UITraitCollection
        setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleLight]];
  }
#endif

  for (NSString *semanticColor in semanticColors) {
    id json = RCTJSONParse([NSString stringWithFormat:@"{ \"semantic\": \"%@\" }", semanticColor], nil);
    UIColor *value = [RCTConvert UIColor:json];
    XCTAssertNotNil(value);

    NSNumber *fallback = [semanticColors objectForKey:semanticColor];
    NSUInteger rgbValue = [fallback unsignedIntegerValue];
    NSUInteger alpha1 = ((rgbValue & 0xFF000000) >> 24);
    NSUInteger red1 = ((rgbValue & 0x00FF0000) >> 16);
    NSUInteger green1 = ((rgbValue & 0x0000FF00) >> 8);
    NSUInteger blue1 = ((rgbValue & 0x000000FF) >> 0);

    CGFloat rgba[4];
    RCTGetRGBAColorComponents([value CGColor], rgba);
    NSUInteger red2 = rgba[0] * 255;
    NSUInteger green2 = rgba[1] * 255;
    NSUInteger blue2 = rgba[2] * 255;
    NSUInteger alpha2 = rgba[3] * 255;

    XCTAssertEqual(red1, red2);
    XCTAssertEqual(green1, green2);
    XCTAssertEqual(blue1, blue2);
    XCTAssertEqual(alpha1, alpha2);
  }

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    [UITraitCollection setCurrentTraitCollection:savedTraitCollection];
  }
#endif
}

@end
