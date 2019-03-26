/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>

#import <RCTAnimation/RCTAnimationUtils.h>

@interface RCTAnimationUtilsTests : XCTestCase

@end

static CGFloat RCTSimpleInterpolation(CGFloat value, NSArray<NSNumber *> *inputRange, NSArray<NSNumber *> *outputRange) {
  return RCTInterpolateValueInRange(value,
                                    inputRange,
                                    outputRange,
                                    EXTRAPOLATE_TYPE_EXTEND,
                                    EXTRAPOLATE_TYPE_EXTEND);
}

@implementation RCTAnimationUtilsTests

// RCTInterpolateValueInRange

- (void)testSimpleOneToOneMapping
{
  NSArray<NSNumber *> *input = @[@0, @1];
  NSArray<NSNumber *> *output = @[@0, @1];
  XCTAssertEqual(RCTSimpleInterpolation(0, input, output), 0);
  XCTAssertEqual(RCTSimpleInterpolation(0.5, input, output), 0.5);
  XCTAssertEqual(RCTSimpleInterpolation(0.8, input, output), 0.8);
  XCTAssertEqual(RCTSimpleInterpolation(1, input, output), 1);
}

- (void)testWiderOutputRange
{
  NSArray<NSNumber *> *input = @[@0, @1];
  NSArray<NSNumber *> *output = @[@100, @200];
  XCTAssertEqual(RCTSimpleInterpolation(0, input, output), 100);
  XCTAssertEqual(RCTSimpleInterpolation(0.5, input, output), 150);
  XCTAssertEqual(RCTSimpleInterpolation(0.8, input, output), 180);
  XCTAssertEqual(RCTSimpleInterpolation(1, input, output), 200);
}

- (void)testWiderInputRange
{
  NSArray<NSNumber *> *input = @[@2000, @3000];
  NSArray<NSNumber *> *output = @[@1, @2];
  XCTAssertEqual(RCTSimpleInterpolation(2000, input, output), 1);
  XCTAssertEqual(RCTSimpleInterpolation(2250, input, output), 1.25);
  XCTAssertEqual(RCTSimpleInterpolation(2800, input, output), 1.8);
  XCTAssertEqual(RCTSimpleInterpolation(3000, input, output), 2);
}

- (void)testManySegments
{
  NSArray<NSNumber *> *input = @[@-1, @1, @5];
  NSArray<NSNumber *> *output = @[@0, @10, @20];
  XCTAssertEqual(RCTSimpleInterpolation(-1, input, output), 0);
  XCTAssertEqual(RCTSimpleInterpolation(0, input, output), 5);
  XCTAssertEqual(RCTSimpleInterpolation(1, input, output), 10);
  XCTAssertEqual(RCTSimpleInterpolation(2, input, output), 12.5);
  XCTAssertEqual(RCTSimpleInterpolation(5, input, output), 20);
}

- (void)testExtendExtrapolate
{
  NSArray<NSNumber *> *input = @[@10, @20];
  NSArray<NSNumber *> *output = @[@0, @1];
  XCTAssertEqual(RCTSimpleInterpolation(30, input, output), 2);
  XCTAssertEqual(RCTSimpleInterpolation(5, input, output), -0.5);
}

- (void)testClampExtrapolate
{
  NSArray<NSNumber *> *input = @[@10, @20];
  NSArray<NSNumber *> *output = @[@0, @1];
  CGFloat value;
  value = RCTInterpolateValueInRange(30,
                                     input,
                                     output,
                                     EXTRAPOLATE_TYPE_CLAMP,
                                     EXTRAPOLATE_TYPE_CLAMP);
  XCTAssertEqual(value, 1);
  value = RCTInterpolateValueInRange(5,
                                     input,
                                     output,
                                     EXTRAPOLATE_TYPE_CLAMP,
                                     EXTRAPOLATE_TYPE_CLAMP);
  XCTAssertEqual(value, 0);
}

- (void)testIdentityExtrapolate
{
  NSArray<NSNumber *> *input = @[@10, @20];
  NSArray<NSNumber *> *output = @[@0, @1];
  CGFloat value;
  value = RCTInterpolateValueInRange(30,
                                     input,
                                     output,
                                     EXTRAPOLATE_TYPE_IDENTITY,
                                     EXTRAPOLATE_TYPE_IDENTITY);
  XCTAssertEqual(value, 30);
  value = RCTInterpolateValueInRange(5,
                                     input,
                                     output,
                                     EXTRAPOLATE_TYPE_IDENTITY,
                                     EXTRAPOLATE_TYPE_IDENTITY);
  XCTAssertEqual(value, 5);
}

@end
