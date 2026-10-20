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

- (void)testPerspectiveFromOnePixelKeepsItsDepth
{
  XCTAssertEqual([RCTConvert CATransform3D:@[ @{@"perspective" : @1000} ]].m34, -1.0 / 1000);
  XCTAssertEqual([RCTConvert CATransform3D:@[ @{@"perspective" : @(-100)} ]].m34, 1.0 / 100);
}

- (void)testAngleInRadiansIsRead
{
  CATransform3D result = [RCTConvert CATransform3D:@[ @{@"rotate" : @"0.5rad"} ]];
  XCTAssertTrue(CATransform3DEqualToTransform(result, CATransform3DMakeRotation(0.5, 0, 0, 1)));
}

- (void)testTranslateWithADepthIsRead
{
  CATransform3D result = [RCTConvert CATransform3D:@[ @{@"translate" : @[ @1, @2, @3 ]} ]];
  XCTAssertEqual(result.m41, 1);
  XCTAssertEqual(result.m42, 2);
  XCTAssertEqual(result.m43, 3);
}

- (void)testTransformOriginIsRead
{
  RCTTransformOrigin result = [RCTConvert RCTTransformOrigin:@[ @10, @"75%", @5 ]];
  XCTAssertEqual(result.x.unit, YGUnitPoint);
  XCTAssertEqual(result.x.value, 10);
  XCTAssertEqual(result.y.unit, YGUnitPercent);
  XCTAssertEqual(result.y.value, 75);
  XCTAssertEqual(result.z, 5);
}

- (void)testTransformOriginHoldingANonFiniteNumberIsIgnored
{
  RCTTransformOrigin noOrigin = [RCTConvert RCTTransformOrigin:nil];
  for (NSArray *transformOrigin in
       @[ @[ @(NAN), @0, @0 ], @[ @0, @(INFINITY), @0 ], @[ @0, @0, @(NAN) ], @[ @"1e39%", @0, @0 ] ]) {
    RCTTransformOrigin result = [RCTConvert RCTTransformOrigin:transformOrigin];
    XCTAssertEqual(result.x.unit, noOrigin.x.unit, @"%@", transformOrigin);
    XCTAssertEqual(result.y.unit, noOrigin.y.unit, @"%@", transformOrigin);
    XCTAssertEqual(result.z, noOrigin.z, @"%@", transformOrigin);
  }
  XCTAssertEqual(noOrigin.x.unit, YGUnitUndefined);
  XCTAssertEqual(noOrigin.y.unit, YGUnitUndefined);
}

- (void)testLegacyViewTransformThatOverflowsWithItsOriginIsIgnored
{
  UIView *view = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 300, 300)];
  view.reactTransformOrigin = [RCTConvert RCTTransformOrigin:@[ @0, @0, @0 ]];

  view.reactTransform = [RCTConvert CATransform3D:@[ @{@"scale" : @2} ]];
  XCTAssertEqual(view.layer.transform.m41, 150);

  view.reactTransform = [RCTConvert CATransform3D:@[ @{@"scale" : @1.3e306} ]];
  XCTAssertTrue(CATransform3DIsIdentity(view.layer.transform));
}

@end
