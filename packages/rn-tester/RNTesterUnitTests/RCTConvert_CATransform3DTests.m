/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTConvert+Transform.h>

@interface RCTConvert_CATransform3DTests : XCTestCase

@end

static BOOL IsFiniteTransform(CATransform3D transform)
{
  const CGFloat *entries = (const CGFloat *)&transform;
  for (NSUInteger index = 0; index < 16; index++) {
    if (!isfinite(entries[index])) {
      return NO;
    }
  }
  return YES;
}

@implementation RCTConvert_CATransform3DTests

- (void)testTransformHoldingANonFiniteNumberIsIgnored
{
  NSArray<NSString *> *operations = @[
    @"perspective",
    @"rotate",
    @"rotateX",
    @"rotateY",
    @"rotateZ",
    @"scale",
    @"scaleX",
    @"scaleY",
    @"skewX",
    @"skewY",
    @"translateX",
    @"translateY",
  ];

  for (NSNumber *nonFiniteNumber in @[ @(NAN), @(INFINITY), @(-INFINITY) ]) {
    NSMutableArray<NSDictionary *> *transforms = [NSMutableArray new];
    for (NSString *operation in operations) {
      [transforms addObject:@{operation : nonFiniteNumber}];
    }
    [transforms addObject:@{@"translate" : @[ nonFiniteNumber, @0 ]}];
    [transforms addObject:@{@"translate" : @[ @0, nonFiniteNumber ]}];
    [transforms
        addObject:@{@"matrix" : @[ nonFiniteNumber, @0, @0, @0, @0, @1, @0, @0, @0, @0, @1, @0, @0, @0, @0, @1 ]}];

    for (NSDictionary *transform in transforms) {
      CATransform3D result = [RCTConvert CATransform3D:@[ @{@"translateX" : @10}, transform ]];
      XCTAssertTrue(CATransform3DIsIdentity(result), @"%@", transform);
    }
  }
}

- (void)testNumberPastTheLargestFloatIsKept
{
  CGFloat pastTheLargestFloat = 1e39;

  CATransform3D translated = [RCTConvert CATransform3D:@[ @{@"translateY" : @(pastTheLargestFloat)} ]];
  XCTAssertEqual(translated.m42, pastTheLargestFloat);

  CATransform3D scaled = [RCTConvert CATransform3D:@[ @{@"scale" : @(pastTheLargestFloat)} ]];
  XCTAssertEqual(scaled.m11, pastTheLargestFloat);
  XCTAssertEqual(scaled.m22, pastTheLargestFloat);
}

- (void)testAnglePastTheLargestFloatIsKept
{
  for (NSString *operation in @[ @"rotate", @"skewX" ]) {
    CATransform3D result = [RCTConvert CATransform3D:@[ @{operation : @"1e+39deg"} ]];
    XCTAssertTrue(IsFiniteTransform(result), @"%@", operation);
    XCTAssertFalse(CATransform3DIsIdentity(result), @"%@", operation);
  }
}

- (void)testTransformWhoseMatrixOverflowsIsIgnored
{
  NSArray *overflowingMatrix = @[ @1e200, @0, @0, @0, @0, @1, @0, @0, @0, @0, @1, @0, @0, @0, @0, @1 ];
  NSArray<NSArray *> *transforms = @[
    @[ @{@"translateX" : @10}, @{@"scale" : @1e200}, @{@"scale" : @1e200} ],
    @[ @{@"translateX" : @10}, @{@"matrix" : overflowingMatrix}, @{@"matrix" : overflowingMatrix} ],
  ];

  for (NSArray *transform in transforms) {
    CATransform3D result = [RCTConvert CATransform3D:transform];
    XCTAssertTrue(CATransform3DIsIdentity(result), @"%@", transform);
  }
}

- (void)testPerspectiveBelowOnePixelRendersAsOnePixel
{
  for (NSNumber *depth in @[ @0, @(-0.0), @0.5 ]) {
    CATransform3D result = [RCTConvert CATransform3D:@[ @{@"perspective" : depth} ]];
    XCTAssertEqual(result.m34, -1, @"depth %@", depth);
  }
}

- (void)testTransformOriginHoldingANonFiniteNumberIsIgnored
{
  for (NSArray *transformOrigin in @[ @[ @(NAN), @0, @0 ], @[ @0, @(INFINITY), @0 ], @[ @0, @0, @(NAN) ] ]) {
    RCTTransformOrigin result = [RCTConvert RCTTransformOrigin:transformOrigin];
    XCTAssertEqual(result.x.unit, YGUnitPercent, @"%@", transformOrigin);
    XCTAssertEqual(result.x.value, 50, @"%@", transformOrigin);
    XCTAssertEqual(result.y.unit, YGUnitPercent, @"%@", transformOrigin);
    XCTAssertEqual(result.y.value, 50, @"%@", transformOrigin);
    XCTAssertEqual(result.z, 0, @"%@", transformOrigin);
  }
}

@end
