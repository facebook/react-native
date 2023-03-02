/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTBridge.h>
#import <React/RCTDevMenu.h>

#if !TARGET_OS_OSX // [macOS]
typedef void (^RCTDevMenuAlertActionHandler)(UIAlertAction *action);
#endif // [macOS]

@interface RCTDevMenu ()

#if !TARGET_OS_OSX // [macOS]
- (RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(RCTDevMenuItem *)item;
#endif // [macOS]

@end

@interface RCTDevMenuTests : XCTestCase

@end

@implementation RCTDevMenuTests {
  RCTBridge *_bridge;
}

- (void)setUp
{
  [super setUp];

  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  _bridge = [[RCTBridge alloc] initWithBundleURL:[bundle URLForResource:@"RNTesterUnitTestsBundle" withExtension:@"js"]
                                  moduleProvider:nil
                                   launchOptions:nil];

  RCT_RUN_RUNLOOP_WHILE(_bridge.isLoading);
}

- (void)testShowCreatingActionSheet
{
  XCTAssertFalse([_bridge.devMenu isActionSheetShown]);
  [_bridge.devMenu show];
  XCTAssertTrue([_bridge.devMenu isActionSheetShown]);
}

#if !TARGET_OS_OSX // [macOS]
- (void)testClosingActionSheetAfterAction
{
  for (RCTDevMenuItem *item in _bridge.devMenu.presentedItems) {
    RCTDevMenuAlertActionHandler handler = [_bridge.devMenu alertActionHandlerForDevItem:item];
    XCTAssertTrue([_bridge.devMenu isActionSheetShown]);

    handler(nil);
    XCTAssertFalse([_bridge.devMenu isActionSheetShown]);

    [_bridge.devMenu show];
    XCTAssertTrue([_bridge.devMenu isActionSheetShown]);
  }
}
#endif // [macOS]

@end
