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

- (void)testCompositeDynamicColor
{
  id json = RCTJSONParse(
      @"{ \"dynamic\": { \"light\": { \"semantic\": \"systemRedColor\" }, \"dark\":{ \"semantic\": \"systemBlueColor\" } } }",
      nil);
  UIColor *value = [RCTConvert UIColor:json];
  XCTAssertNotNil(value);

  id savedTraitCollection = [UITraitCollection currentTraitCollection];

  [UITraitCollection
      setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleLight]];

  XCTAssertTrue(CGColorsAreEqual([value CGColor], [[UIColor systemRedColor] CGColor]));

  [UITraitCollection
      setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleDark]];

  XCTAssertTrue(CGColorsAreEqual([value CGColor], [[UIColor systemBlueColor] CGColor]));

  [UITraitCollection setCurrentTraitCollection:savedTraitCollection];
}

static NSArray<NSNumber *> *UIColorAsNSUInt(UIColor *color)
{
  CGFloat red, green, blue, alpha;

  [color getRed:&red green:&green blue:&blue alpha:&alpha];

  return @[ @(alpha * 255), @(red * 255), @(green * 255), @(blue * 255) ];
}

- (void)testGenerateFallbacks
{
  NSDictionary<NSString *, NSArray<NSNumber *> *> *semanticColors = @{
    // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
    // Label Colors
    @"labelColor" : UIColorAsNSUInt(UIColor.labelColor),
    @"secondaryLabelColor" : UIColorAsNSUInt(UIColor.secondaryLabelColor),
    @"tertiaryLabelColor" : UIColorAsNSUInt(UIColor.tertiaryLabelColor),
    @"quaternaryLabelColor" : UIColorAsNSUInt(UIColor.quaternaryLabelColor),
    // Fill Colors
    @"systemFillColor" : UIColorAsNSUInt(UIColor.systemFillColor),
    @"secondarySystemFillColor" : UIColorAsNSUInt(UIColor.secondarySystemFillColor),
    @"tertiarySystemFillColor" : UIColorAsNSUInt(UIColor.tertiarySystemFillColor),
    @"quaternarySystemFillColor" : UIColorAsNSUInt(UIColor.quaternarySystemFillColor),
    // Text Colors
    @"placeholderTextColor" : UIColorAsNSUInt(UIColor.placeholderTextColor),
    // Standard Content Background Colors
    @"systemBackgroundColor" : UIColorAsNSUInt(UIColor.systemBackgroundColor),
    @"secondarySystemBackgroundColor" : UIColorAsNSUInt(UIColor.secondarySystemBackgroundColor),
    @"tertiarySystemBackgroundColor" : UIColorAsNSUInt(UIColor.tertiarySystemBackgroundColor),
    // Grouped Content Background Colors
    @"systemGroupedBackgroundColor" : UIColorAsNSUInt(UIColor.systemGroupedBackgroundColor),
    @"secondarySystemGroupedBackgroundColor" : UIColorAsNSUInt(UIColor.secondarySystemGroupedBackgroundColor),
    @"tertiarySystemGroupedBackgroundColor" : UIColorAsNSUInt(UIColor.tertiarySystemGroupedBackgroundColor),
    // Separator Colors
    @"separatorColor" : UIColorAsNSUInt(UIColor.separatorColor),
    @"opaqueSeparatorColor" : UIColorAsNSUInt(UIColor.opaqueSeparatorColor),
    // Link Color
    @"linkColor" : UIColorAsNSUInt(UIColor.linkColor),
    // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
    // Adaptable Colors
    @"systemBrownColor" : UIColorAsNSUInt(UIColor.systemBrownColor),
    @"systemIndigoColor" : UIColorAsNSUInt(UIColor.systemIndigoColor),
    // Adaptable Gray Colors
    @"systemGray2Color" : UIColorAsNSUInt(UIColor.systemGray2Color),
    @"systemGray3Color" : UIColorAsNSUInt(UIColor.systemGray3Color),
    @"systemGray4Color" : UIColorAsNSUInt(UIColor.systemGray4Color),
    @"systemGray5Color" : UIColorAsNSUInt(UIColor.systemGray5Color),
    @"systemGray6Color" : UIColorAsNSUInt(UIColor.systemGray6Color),
    // Clear Color
    @"clearColor" : UIColorAsNSUInt(UIColor.clearColor),
  };

  id savedTraitCollection = nil;

  savedTraitCollection = [UITraitCollection currentTraitCollection];

  [UITraitCollection
      setCurrentTraitCollection:[UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleLight]];

  for (NSString *semanticColor in semanticColors) {
    id json = RCTJSONParse([NSString stringWithFormat:@"{ \"semantic\": \"%@\" }", semanticColor], nil);
    UIColor *value = [RCTConvert UIColor:json];
    XCTAssertNotNil(value);

    NSArray<NSNumber *> *fallback = [semanticColors objectForKey:semanticColor];
    NSUInteger alpha1 = [fallback[0] unsignedIntegerValue];
    NSUInteger red1 = [fallback[1] unsignedIntegerValue];
    NSUInteger green1 = [fallback[2] unsignedIntegerValue];
    NSUInteger blue1 = [fallback[3] unsignedIntegerValue];

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

  [UITraitCollection setCurrentTraitCollection:savedTraitCollection];
}

@end
