/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

@interface RNTesterSnapshotTests : XCTestCase {
  RCTTestRunner *_runner;
}

@end

@implementation RNTesterSnapshotTests

- (void)setUp
{
#if !TARGET_OS_OSX // [macOS]
  _runner = RCTInitRunnerForApp(@"js/RNTesterApp.ios", nil, nil);
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10) {
    _runner.testSuffix = [NSString stringWithFormat:@"-iOS%d", UIDevice.currentDevice.systemVersion.intValue];
  }
#else // [macOS
  _runner = RCTInitRunnerForApp(@"js/RNTesterApp.macos", nil, nil);
#endif // macOS]

  // To update snapshots, set recordMode to YES and re-run RNTesterSnapshotTests.
  // Do not forget to set back to NO before committing your changes.
  _runner.recordMode = NO;
}

#define RCT_TEST(name)                     \
  -(void)test##name                        \
  {                                        \
    [_runner runTest:_cmd module:@ #name]; \
  }

#if !TARGET_OS_OSX // [macOS] Github #1739: Disable these failing tests
RCT_TEST(ViewExample)
RCT_TEST(LayoutExample)
RCT_TEST(ScrollViewExample)
RCT_TEST(TextExample)
#endif // [macOS]

- (void)testZZZNotInRecordMode
{
  XCTAssertFalse(_runner.recordMode, @"Don't forget to turn record mode back to off");
}

@end
