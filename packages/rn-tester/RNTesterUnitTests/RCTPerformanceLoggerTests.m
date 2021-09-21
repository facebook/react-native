/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTPerformanceLogger.h>

#import <XCTest/XCTest.h>

@interface RCTPerformanceLoggerTests : XCTestCase

@end

@implementation RCTPerformanceLoggerTests

- (void)testLabelCountInSyncWithRCTPLTag
{
  RCTPerformanceLogger *logger = [[RCTPerformanceLogger alloc] init];
  XCTAssertEqual([logger labelsForTags].count, RCTPLSize);
}

@end
