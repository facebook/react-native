// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

#import "RCTAssert.h"

@interface IntegrationTestsTests : XCTestCase

@end

@implementation IntegrationTestsTests {
  RCTTestRunner *_runner;
}

- (void)setUp
{
  _runner = [[RCTTestRunner alloc] initWithApp:@"IntegrationTests/IntegrationTestsApp"];
}

- (void)testTheTester
{
  [_runner runTest:@"IntegrationTestHarnessTest"];
}

- (void)testTheTester_waitOneFrame
{
  [_runner runTest:@"IntegrationTestHarnessTest" initialProps:@{@"waitOneFrame": @YES} expectErrorBlock:nil];
}

- (void)testTheTester_ExpectError
{
  [_runner runTest:@"IntegrationTestHarnessTest"
      initialProps:@{@"shouldThrow": @YES}
  expectErrorRegex:[NSRegularExpression regularExpressionWithPattern:@"because shouldThrow" options:0 error:nil]];
}

- (void)testTimers
{
  [_runner runTest:@"TimersTest"];
}

@end
