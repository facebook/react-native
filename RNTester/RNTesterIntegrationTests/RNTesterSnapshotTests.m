/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <React/RCTUIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

@interface RNTesterSnapshotTests : XCTestCase
{
  RCTTestRunner *_runner;
}

@end

@implementation RNTesterSnapshotTests

- (void)setUp
{
#if !TARGET_OS_OSX
  _runner = RCTInitRunnerForApp(@"RNTester/js/RNTesterApp.ios", nil, nil);
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10) {
    _runner.testSuffix = [NSString stringWithFormat:@"-iOS%d", UIDevice.currentDevice.systemVersion.intValue];
  }
#else // TARGET_OS_OSX
  _runner = RCTInitRunnerForApp(@"RNTester/js/RNTesterApp.macos", nil, nil);
#endif
  _runner.recordMode = NO;
}

#define RCT_TEST(name)                  \
- (void)test##name                      \
{                                       \
  [_runner runTest:_cmd module:@#name]; \
}

RCT_TEST(ViewExample)
RCT_TEST(LayoutExample)
RCT_TEST(ARTExample)
RCT_TEST(ScrollViewExample)
#if !TARGET_OS_TV
// TODO(OSS Candidate ISS#2710739): RCTPicker which TextExample depends on not available on tvOS
RCT_TEST(TextExample)
// No switch or slider available on tvOS
RCT_TEST(SwitchExample)
RCT_TEST(SliderExample)
#endif

- (void)testZZZNotInRecordMode
{
  XCTAssertFalse(_runner.recordMode, @"Don't forget to turn record mode back to off");
}

@end
