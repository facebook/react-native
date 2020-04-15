/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@interface RCTTestViewManager : RCTViewManager
@end

@implementation RCTTestViewManager

RCT_EXPORT_MODULE()

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"

- (NSArray<NSString *> *)customBubblingEventTypes
{
  return @[@"foo"];
}

#pragma clang diagnostic pop

@end


@interface RCTNotificationObserverModule : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL didDetectViewManagerInit;

@end

@implementation RCTNotificationObserverModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didInitViewManager:) name:RCTDidInitializeModuleNotification object:nil];
}

- (void)didInitViewManager:(NSNotification *)note
{
  id<RCTBridgeModule> module = note.userInfo[@"module"];
  if ([module isKindOfClass:[RCTTestViewManager class]]) {
    _didDetectViewManagerInit = YES;
  }
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end

@interface RCTModuleInitNotificationRaceTests : XCTestCase <RCTBridgeDelegate>
{
  RCTBridge *_bridge;
  RCTNotificationObserverModule *_notificationObserver;
}
@end

@implementation RCTModuleInitNotificationRaceTests

- (NSURL *)sourceURLForBridge:(__unused RCTBridge *)bridge
{
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  return [bundle URLForResource:@"RNTesterUnitTestsBundle" withExtension:@"js"];
}

- (NSArray *)extraModulesForBridge:(__unused RCTBridge *)bridge
{
  return @[[RCTTestViewManager new], _notificationObserver];
}

- (void)setUp
{
  [super setUp];

  _notificationObserver = [RCTNotificationObserverModule new];
  _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];

  dispatch_async(dispatch_get_main_queue(), ^{
    [[self->_bridge uiManager] constantsToExport];
  });
}

- (void)tearDown
{
  [super tearDown];

  _notificationObserver = nil;
  [_bridge invalidate];
  _bridge = nil;
}

- (void)testViewManagerNotInitializedBeforeSetBridgeModule
{
  RCT_RUN_RUNLOOP_WHILE(!_notificationObserver.didDetectViewManagerInit);
}

@end
