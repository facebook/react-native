/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// TODO(macOS ISS#3536887)

#import <XCTest/XCTest.h>

#import <React/RCTConvert.h>
#import <React/RCTDynamicColor.h>

@interface RCTConvert_NSColorTests : XCTestCase

@end

@implementation RCTConvert_NSColorTests

- (void)testColor
{
  id json = RCTJSONParse(@"{ \"semantic\": \"labelColor\" }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  XCTAssertEqualObjects(value, [NSColor labelColor]);
}

- (void)testColorFailure
{
  id json = RCTJSONParse(@"{ \"semantic\": \"bogusColor\" }", nil);

  __block NSString *errorMessage = nil;
  RCTLogFunction defaultLogFunction = RCTGetLogFunction();
  RCTSetLogFunction(^(__unused RCTLogLevel level, __unused RCTLogSource source, __unused NSString *fileName, __unused NSNumber *lineNumber, NSString *message) {
    errorMessage = message;
  });

  NSColor *value = [RCTConvert UIColor:json];

  RCTSetLogFunction(defaultLogFunction);

  XCTAssertEqualObjects(value, nil);
  XCTAssertTrue([errorMessage containsString:@"labelColor"]); // the RedBox message will contain a list of the valid color names.
}

- (void)testFallbackColor
{
  id json = RCTJSONParse(@"{ \"semantic\": \"unitTestFallbackColor\" }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  XCTAssertEqualObjects(value, [NSColor gridColor]);
}

- (void)testAlternatingColorEven
{
  id json = RCTJSONParse(@"{ \"semantic\": \"alternatingContentBackgroundColorEven\" }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  if (@available(macOS 10.14, *)) {
    XCTAssertEqualObjects(value, [NSColor alternatingContentBackgroundColors][0]);
  }
}

- (void)testAlternatingColorOdd
{
  id json = RCTJSONParse(@"{ \"semantic\": \"alternatingContentBackgroundColorOdd\" }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  if (@available(macOS 10.14, *)) {
    XCTAssertEqualObjects(value, [NSColor alternatingContentBackgroundColors][1]);
  }
}

- (void)testAlternatingColorFallbackEven
{
  id json = RCTJSONParse(@"{ \"semantic\": \"unitTestFallbackColorEven\" }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  XCTAssertEqualObjects(value, [NSColor controlAlternatingRowBackgroundColors][0]);
}

- (void)testAlternatingColorFallbackOdd
{
  id json = RCTJSONParse(@"{ \"semantic\": \"unitTestFallbackColorOdd\" }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  XCTAssertEqualObjects(value, [NSColor controlAlternatingRowBackgroundColors][1]);
}

- (void)testDynamicColor
{
  // 0        == 0x00000000 == black
  // 16777215 == 0x00FFFFFF == white
  id json = RCTJSONParse(@"{ \"dynamic\": { \"light\":0, \"dark\":16777215 } }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  XCTAssertTrue([value isKindOfClass:[RCTDynamicColor class]]);
  CGFloat r, g, b, a;

  [NSAppearance setCurrentAppearance:[NSAppearance appearanceNamed:NSAppearanceNameAqua]];
  [value getRed:&r green:&g blue:&b alpha:&a];
  XCTAssertEqual(r, 0);
  XCTAssertEqual(g, 0);
  XCTAssertEqual(b, 0);
  XCTAssertEqual(a, 0);

  if (@available(macOS 10.14, *)) {
    [NSAppearance setCurrentAppearance:[NSAppearance appearanceNamed:NSAppearanceNameDarkAqua]];
    [value getRed:&r green:&g blue:&b alpha:&a];
    XCTAssertEqual(r, 1);
    XCTAssertEqual(g, 1);
    XCTAssertEqual(b, 1);
    XCTAssertEqual(a, 0);
  }

  [NSAppearance setCurrentAppearance:nil];
}

- (void)testCompositeDynamicColor
{
  id json = RCTJSONParse(@"{ \"dynamic\": { \"light\": { \"semantic\": \"systemRedColor\" }, \"dark\":{ \"semantic\": \"systemBlueColor\" } } }", nil);
  NSColor *value = [RCTConvert UIColor:json];
  XCTAssertTrue([value isKindOfClass:[RCTDynamicColor class]]);
  CGFloat r1, g1, b1, a1;
  CGFloat r2, g2, b2, a2;

  [NSAppearance setCurrentAppearance:[NSAppearance appearanceNamed:NSAppearanceNameAqua]];
  [[value colorUsingColorSpaceName:NSCalibratedRGBColorSpace] getRed:&r1 green:&g1 blue:&b1 alpha:&a1];
  [[[NSColor systemRedColor] colorUsingColorSpaceName:NSCalibratedRGBColorSpace] getRed:&r2 green:&g2 blue:&b2 alpha:&a2];
  XCTAssertEqual(r1, r2);
  XCTAssertEqual(g1, g2);
  XCTAssertEqual(b1, b2);
  XCTAssertEqual(a1, a2);

  if (@available(macOS 10.14, *)) {
    [NSAppearance setCurrentAppearance:[NSAppearance appearanceNamed:NSAppearanceNameDarkAqua]];
    [[value colorUsingColorSpaceName:NSCalibratedRGBColorSpace] getRed:&r1 green:&g1 blue:&b1 alpha:&a1];
    [[[NSColor systemBlueColor] colorUsingColorSpaceName:NSCalibratedRGBColorSpace] getRed:&r2 green:&g2 blue:&b2 alpha:&a2];
    XCTAssertEqual(r1, r2);
    XCTAssertEqual(g1, g2);
    XCTAssertEqual(b1, b2);
    XCTAssertEqual(a1, a2);
  }

  [NSAppearance setCurrentAppearance:nil];
}

@end
