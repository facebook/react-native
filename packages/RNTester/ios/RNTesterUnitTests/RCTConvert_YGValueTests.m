/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTConvert.h>

@interface RCTConvert_YGValueTests : XCTestCase

@end

@implementation RCTConvert_YGValueTests

- (void)testUndefined
{
  YGValue value = [RCTConvert YGValue:nil];
  XCTAssertEqual(value.unit, YGUnitUndefined);
}

- (void)testNumberPoints
{
  YGValue value = [RCTConvert YGValue:@100];
  XCTAssertEqual(value.unit, YGUnitPoint);
  XCTAssertEqual(value.value, 100);
}

- (void)testStringPercent
{
  YGValue value = [RCTConvert YGValue:@"100%"];
  XCTAssertEqual(value.unit, YGUnitPercent);
  XCTAssertEqual(value.value, 100);
}

@end
