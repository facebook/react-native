/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

#import "RCTAssert.h"

@interface IntegrationTestsTests : XCTestCase

@end

@implementation IntegrationTestsTests
{
  RCTTestRunner *_runner;
}

- (void)setUp
{
#ifdef __LP64__
  RCTAssert(!__LP64__, @"Tests should be run on 32-bit device simulators (e.g. iPhone 5)");
#endif
  NSString *version = [[UIDevice currentDevice] systemVersion];
  RCTAssert([version integerValue] == 8, @"Tests should be run on iOS 8.x, found %@", version);
  _runner = RCTInitRunnerForApp(@"IntegrationTests/IntegrationTestsApp");

  // If tests have changes, set recordMode = YES below and run the affected
  // tests on an iPhone5, iOS 8.1 simulator.
  _runner.recordMode = NO;
}

#pragma mark Logic Tests

- (void)testTheTester
{
  [_runner runTest:_cmd module:@"IntegrationTestHarnessTest"];
}

- (void)testTheTester_waitOneFrame
{
  [_runner runTest:_cmd
            module:@"IntegrationTestHarnessTest"
      initialProps:@{@"waitOneFrame": @YES}
  expectErrorBlock:nil];
}

// TODO: this seems to stall forever - figure out why
- (void)DISABLED_testTheTester_ExpectError
{
  [_runner runTest:_cmd
            module:@"IntegrationTestHarnessTest"
      initialProps:@{@"shouldThrow": @YES}
  expectErrorRegex:@"because shouldThrow"];
}

- (void)testTimers
{
  [_runner runTest:_cmd module:@"TimersTest"];
}

- (void)testAsyncStorage
{
  [_runner runTest:_cmd module:@"AsyncStorageTest"];
}

- (void)testLayoutEvents
{
  [_runner runTest:_cmd module:@"LayoutEventsTest"];
}

- (void)testAppEvents
{
  [_runner runTest:_cmd module:@"AppEventsTest"];
}

#pragma mark Snapshot Tests

- (void)testSimpleSnapshot
{
  [_runner runTest:_cmd module:@"SimpleSnapshotTest"];
}

- (void)testZZZ_NotInRecordMode
{
  RCTAssert(_runner.recordMode == NO, @"Don't forget to turn record mode back to NO before commit.");
}

@end
