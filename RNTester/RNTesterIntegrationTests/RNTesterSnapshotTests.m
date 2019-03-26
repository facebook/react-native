/**
 * Copyright (c) 2015-present, Facebook, Inc.
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
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 11) {
    _runner.testSuffix = @"-iOS11";
  } else if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10) {
    _runner.testSuffix = @"-iOS10";
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

// TODO(ISS#2739352: the tests disabled below do not reliably pass on XCode 10.1)
//RCT_TEST(ViewExample)
RCT_TEST(LayoutExample)
RCT_TEST(ARTExample)
RCT_TEST(ScrollViewExample)
//RCT_TEST(TextExample)
#if !TARGET_OS_TV
// No switch or slider available on tvOS
//RCT_TEST(SwitchExample)
//RCT_TEST(SliderExample)
//RCT_TEST(TabBarExample)
#endif

- (void)testZZZNotInRecordMode
{
  XCTAssertFalse(_runner.recordMode, @"Don't forget to turn record mode back to off");
}

@end
