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
