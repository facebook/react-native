//
//  RCTPerformanceLoggerTests.m
//  RNTesterUnitTests
//
//  Created by Kyle Fang on 5/12/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

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
