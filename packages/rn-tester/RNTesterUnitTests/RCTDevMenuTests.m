/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTBridge.h>
#import <React/RCTDevMenu.h>

typedef void(^RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface RCTDevMenu ()

- (UIAlertController *)alertController;
- (RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(RCTDevMenuItem *)item;

@end

@interface RCTDevMenuTests : XCTestCase

@end

@implementation RCTDevMenuTests
{
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
  XCTAssertNil([_bridge.devMenu alertController]);
  XCTAssertFalse([_bridge.devMenu isActionSheetShown]);

  [_bridge.devMenu show];

  XCTAssertNotNil([_bridge.devMenu alertController]);
  XCTAssertFalse([_bridge.devMenu isActionSheetShown]);
}

- (void)testClosingActionSheetAfterAction
{
  XCTAssertNil([_bridge.devMenu alertController]);
  XCTAssertFalse([_bridge.devMenu isActionSheetShown]);

  [_bridge.devMenu show];

  for (RCTDevMenuItem *item in _bridge.devMenu.presentedItems) {
    RCTDevMenuAlertActionHandler handler = [_bridge.devMenu alertActionHandlerForDevItem:item];
    XCTAssertNotNil([_bridge.devMenu alertController]);

    handler(nil);
    XCTAssertNil([_bridge.devMenu alertController]);

    [_bridge.devMenu show];
    XCTAssertNotNil([_bridge.devMenu alertController]);
  }
}

@end
