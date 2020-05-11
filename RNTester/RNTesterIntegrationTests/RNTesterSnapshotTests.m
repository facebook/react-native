/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#3536887)
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
#if !TARGET_OS_OSX // TODO(macOS ISS#3536887)
  _runner = RCTInitRunnerForApp(@"RNTester/js/RNTesterApp.ios", nil, nil);
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10) {
    _runner.testSuffix = [NSString stringWithFormat:@"-iOS%d", UIDevice.currentDevice.systemVersion.intValue];
  }
#else // [TODO(macOS ISS#3536887)
  _runner = RCTInitRunnerForApp(@"RNTester/js/RNTesterApp.macos", nil, nil);
#endif // ]TODO(macOS ISS#3536887)
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
#if !TARGET_OS_OSX // Reason: Intermittent failure: crash deallocating NSTextStorage of a TextView: tracked by https://github.com/microsoft/react-native-macos/issues/357
RCT_TEST(TextExample)
#endif
#if !TARGET_OS_TV
// No switch or slider available on tvOS
RCT_TEST(SwitchExample)
RCT_TEST(SliderExample)
#endif

- (void)testZZZNotInRecordMode
{
  XCTAssertFalse(_runner.recordMode, @"Don't forget to turn record mode back to off");
}

@end
