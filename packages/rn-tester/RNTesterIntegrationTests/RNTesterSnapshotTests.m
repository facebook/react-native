/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

@interface RNTesterSnapshotTests : XCTestCase {
  RCTTestRunner *_runner;
}

@end

@implementation RNTesterSnapshotTests

- (void)setUp
{
  _runner = RCTInitRunnerForApp(@"packages/rn-tester/js/RNTesterApp.ios", nil, nil);
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10) {
    _runner.testSuffix = [NSString stringWithFormat:@"-iOS%d", UIDevice.currentDevice.systemVersion.intValue];
  }
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
