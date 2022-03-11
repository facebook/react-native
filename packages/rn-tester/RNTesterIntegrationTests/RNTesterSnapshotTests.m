/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#3536887)
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

@interface RNTesterSnapshotTests : XCTestCase {
  RCTTestRunner *_runner;
}

@end

@implementation RNTesterSnapshotTests

- (void)setUp
{
#if !TARGET_OS_OSX // TODO(macOS ISS#3536887)
  _runner = RCTInitRunnerForApp(@"packages/rn-tester/js/RNTesterApp.ios", nil, nil);
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10) {
    _runner.testSuffix = [NSString stringWithFormat:@"-iOS%d", UIDevice.currentDevice.systemVersion.intValue];
  }
#else // [TODO(macOS ISS#3536887)
  _runner = RCTInitRunnerForApp(@"packages/rn-tester/js/RNTesterApp.macos", nil, nil);
#endif // ]TODO(macOS ISS#3536887)

  // ---------
  // WHEN SNAPSHOTS ARE FAILING LOCALLY
  // THIS IS THE LINE TO CHANGE TO "YES"
  // SO THAT YOU CAN REGENERATE THE SNAPSHOTS!
  // ---------
  _runner.recordMode = NO;
}

#define RCT_TEST(name)                     \
  -(void)test##name                        \
  {                                        \
    [_runner runTest:_cmd module:@ #name]; \
  }

RCT_TEST(ViewExample)
RCT_TEST(LayoutExample)
RCT_TEST(ScrollViewExample)
RCT_TEST(TextExample)
#if !TARGET_OS_TV
// No switch available on tvOS
RCT_TEST(SwitchExample)
#endif

- (void)testZZZNotInRecordMode
{
  XCTAssertFalse(_runner.recordMode, @"Don't forget to turn record mode back to off");
}

@end
