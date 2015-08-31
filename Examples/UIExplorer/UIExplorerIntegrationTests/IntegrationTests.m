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

@interface IntegrationTests : XCTestCase

@end

@implementation IntegrationTests
{
  RCTTestRunner *_runner;
}

- (void)setUp
{
#if __LP64__
  RCTAssert(NO, @"Tests should be run on 32-bit device simulators (e.g. iPhone 5)");
#endif

  NSOperatingSystemVersion version = [NSProcessInfo processInfo].operatingSystemVersion;
  RCTAssert(version.majorVersion == 8 || version.minorVersion >= 3, @"Tests should be run on iOS 8.3+, found %zd.%zd.%zd", version.majorVersion, version.minorVersion, version.patchVersion);
  _runner = RCTInitRunnerForApp(@"Examples/UIExplorer/UIExplorerIntegrationTests/js/IntegrationTestsApp", nil);
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

- (void)testTheTester_ExpectError
{
  [_runner runTest:_cmd
            module:@"IntegrationTestHarnessTest"
      initialProps:@{@"shouldThrow": @YES}
  expectErrorRegex:@"because shouldThrow"];
}

- (void)DISABLED_testTimers // #8192477
{
  [_runner runTest:_cmd module:@"TimersTest"];
}

- (void)testAsyncStorage
{
  [_runner runTest:_cmd module:@"AsyncStorageTest"];
}

- (void)DISABLED_testLayoutEvents // #7149037
{
  [_runner runTest:_cmd module:@"LayoutEventsTest"];
}

- (void)testAppEvents
{
  [_runner runTest:_cmd module:@"AppEventsTest"];
}

- (void)testPromises
{
  [_runner runTest:_cmd module:@"PromiseTest"];
}

#pragma mark Snapshot Tests

- (void)testSimpleSnapshot
{
  // If tests have changes, set recordMode = YES below and re-run
  _runner.recordMode = NO;
  [_runner runTest:_cmd module:@"SimpleSnapshotTest"];
}

@end
