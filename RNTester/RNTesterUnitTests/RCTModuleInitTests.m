/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTUtils.h>

@interface RCTTestInjectedModule : NSObject <RCTBridgeModule>
@end

@implementation RCTTestInjectedModule

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

@end


@interface RCTTestCustomInitModule : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL initializedOnMainQueue;

@end

@implementation RCTTestCustomInitModule

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

- (id)init
{
  if ((self = [super init])) {
    _initializedOnMainQueue = RCTIsMainQueue();
  }
  return self;
}

@end


@interface RCTTestCustomSetBridgeModule : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;

@end

@implementation RCTTestCustomSetBridgeModule

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  _setBridgeOnMainQueue = RCTIsMainQueue();
}

@end


@interface RCTTestExportConstantsModule : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL exportedConstants;
@property (nonatomic, assign) BOOL exportedConstantsOnMainQueue;

@end

@implementation RCTTestExportConstantsModule

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  _exportedConstants = YES;
  _exportedConstantsOnMainQueue = RCTIsMainQueue();
  return @{ @"foo": @"bar" };
}

@end


@interface RCTLazyInitModule : NSObject <RCTBridgeModule>
@end

@implementation RCTLazyInitModule

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

@end


@interface RCTModuleInitTests : XCTestCase <RCTBridgeDelegate>
{
  RCTBridge *_bridge;
  BOOL _injectedModuleInitNotificationSent;
  BOOL _customInitModuleNotificationSent;
  BOOL _customSetBridgeModuleNotificationSent;
  BOOL _exportConstantsModuleNotificationSent;
  BOOL _lazyInitModuleNotificationSent;
  BOOL _lazyInitModuleNotificationSentOnMainQueue;
  BOOL _viewManagerModuleNotificationSent;
  RCTTestInjectedModule *_injectedModule;
}
@end

@implementation RCTModuleInitTests

- (NSURL *)sourceURLForBridge:(__unused RCTBridge *)bridge
{
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  return [bundle URLForResource:@"RNTesterUnitTestsBundle" withExtension:@"js"];
}

- (NSArray *)extraModulesForBridge:(__unused RCTBridge *)bridge
{
  return @[_injectedModule];
}

- (void)setUp
{
  [super setUp];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(moduleDidInit:) name:RCTDidInitializeModuleNotification object:nil];

  _injectedModuleInitNotificationSent = NO;
  _customInitModuleNotificationSent = NO;
  _customSetBridgeModuleNotificationSent = NO;
  _exportConstantsModuleNotificationSent = NO;
  _lazyInitModuleNotificationSent = NO;
  _viewManagerModuleNotificationSent = NO;
  _injectedModule = [RCTTestInjectedModule new];
  _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
}

- (void)tearDown
{
  [super tearDown];

  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTDidInitializeModuleNotification object:nil];

  [_bridge invalidate];
  _bridge = nil;
}

- (void)moduleDidInit:(NSNotification *)note
{
  id<RCTBridgeModule> module = note.userInfo[@"module"];
  if ([module isKindOfClass:[RCTTestInjectedModule class]]) {
    _injectedModuleInitNotificationSent = YES;
  } else if ([module isKindOfClass:[RCTTestCustomInitModule class]]) {
    _customInitModuleNotificationSent = YES;
  } else if ([module isKindOfClass:[RCTTestCustomSetBridgeModule class]]) {
    _customSetBridgeModuleNotificationSent = YES;
  } else if ([module isKindOfClass:[RCTTestExportConstantsModule class]]) {
    _exportConstantsModuleNotificationSent = YES;
  } else if ([module isKindOfClass:[RCTLazyInitModule class]]) {
    _lazyInitModuleNotificationSent = YES;
    _lazyInitModuleNotificationSentOnMainQueue = RCTIsMainQueue();
  }
}

- (void)testInjectedModulesInitializedDuringBridgeInit
{
  XCTAssertEqual(_injectedModule, [_bridge moduleForClass:[RCTTestInjectedModule class]]);
  XCTAssertEqual(_injectedModule.bridge, _bridge.batchedBridge);
  XCTAssertNotNil(_injectedModule.methodQueue);
  RCT_RUN_RUNLOOP_WHILE(!_injectedModuleInitNotificationSent);
  XCTAssertTrue(_injectedModuleInitNotificationSent);
}

- (void)testCustomInitModuleInitializedAtBridgeStartup
{
  RCT_RUN_RUNLOOP_WHILE(!_customInitModuleNotificationSent);
  XCTAssertTrue(_customInitModuleNotificationSent);
  RCTTestCustomInitModule *module = [_bridge moduleForClass:[RCTTestCustomInitModule class]];
  XCTAssertTrue(module.initializedOnMainQueue);
  XCTAssertEqual(module.bridge, _bridge.batchedBridge);
  XCTAssertNotNil(module.methodQueue);
}

- (void)testCustomSetBridgeModuleInitializedAtBridgeStartup
{
  XCTAssertFalse(_customSetBridgeModuleNotificationSent);

  __block RCTTestCustomSetBridgeModule *module;
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    module = [self->_bridge moduleForClass:[RCTTestCustomSetBridgeModule class]];
  });

  RCT_RUN_RUNLOOP_WHILE(!module);
  XCTAssertTrue(_customSetBridgeModuleNotificationSent);
  XCTAssertFalse(module.setBridgeOnMainQueue);
  XCTAssertEqual(module.bridge, _bridge.batchedBridge);
  XCTAssertNotNil(module.methodQueue);
}

- (void)testExportConstantsModuleInitializedAtBridgeStartup
{
  RCT_RUN_RUNLOOP_WHILE(!_exportConstantsModuleNotificationSent);
  XCTAssertTrue(_exportConstantsModuleNotificationSent);
  RCTTestExportConstantsModule *module = [_bridge moduleForClass:[RCTTestExportConstantsModule class]];
  RCT_RUN_RUNLOOP_WHILE(!module.exportedConstants);
  XCTAssertTrue(module.exportedConstants);
  XCTAssertTrue(module.exportedConstantsOnMainQueue);
  XCTAssertEqual(module.bridge, _bridge.batchedBridge);
  XCTAssertNotNil(module.methodQueue);
}

- (void)testLazyInitModuleNotInitializedDuringBridgeInit
{
  XCTAssertFalse(_lazyInitModuleNotificationSent);

  __block RCTLazyInitModule *module;
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    module = [self->_bridge moduleForClass:[RCTLazyInitModule class]];
  });

  RCT_RUN_RUNLOOP_WHILE(!module);
  XCTAssertTrue(_lazyInitModuleNotificationSent);
  XCTAssertFalse(_lazyInitModuleNotificationSentOnMainQueue);
  XCTAssertNotNil(module);
  XCTAssertEqual(module.bridge, _bridge.batchedBridge);
  XCTAssertNotNil(module.methodQueue);
}

@end
