/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#if (defined(COCOAPODS))
#import <React-RCTTest/React/RCTTestRunner.h>
#else
#import <RCTTest/RCTTestRunner.h>
#endif
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTModuleMethod.h>
#import <React/RCTRootView.h>

@interface AllocationTestModule : NSObject<RCTBridgeModule, RCTInvalidating>

@property (nonatomic, assign, getter=isValid) BOOL valid;

@end

@implementation AllocationTestModule

RCT_EXPORT_MODULE();

- (instancetype)init
{
  if ((self = [super init])) {
    _valid = YES;
  }
  return self;
}

- (void)invalidate
{
  _valid = NO;
}

RCT_EXPORT_METHOD(test:(__unused NSString *)a
                      :(__unused NSNumber *)b
                      :(__unused RCTResponseSenderBlock)c
                      :(__unused RCTResponseErrorBlock)d) {}

@end

@interface RCTAllocationTests : XCTestCase
@end

@implementation RCTAllocationTests {
  NSURL *_bundleURL;
}

- (void)setUp
{
  [super setUp];

  NSString *bundleContents =
  @"var __fbBatchedBridge = {"
   "  callFunctionReturnFlushedQueue: function() { return null; },"
   "  invokeCallbackAndReturnFlushedQueue: function() { return null; },"
   "  flushedQueue: function() { return null; },"
   "  callFunctionReturnResultAndFlushedQueue: function() { return null; },"
   "};";

  NSURL *tempDir = [NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES];
  [[NSFileManager defaultManager] createDirectoryAtURL:tempDir withIntermediateDirectories:YES attributes:nil error:NULL];
  NSString *guid = [[NSProcessInfo processInfo] globallyUniqueString];
  NSString *fileName = [NSString stringWithFormat:@"rctallocationtests-bundle-%@.js", guid];

  _bundleURL = [tempDir URLByAppendingPathComponent:fileName];
  NSError *saveError;
  if (![bundleContents writeToURL:_bundleURL atomically:YES encoding:NSUTF8StringEncoding error:&saveError]) {
    XCTFail(@"Failed to save test bundle to %@, error: %@", _bundleURL, saveError);
  };
}

- (void)tearDown
{
  [super tearDown];

  [[NSFileManager defaultManager] removeItemAtURL:_bundleURL error:NULL];
}

- (void)testBridgeIsDeallocated
{
  __weak RCTBridge *weakBridge;
  @autoreleasepool {
    RCTRootView *view = [[RCTRootView alloc] initWithBundleURL:_bundleURL
                                                    moduleName:@""
                                             initialProperties:nil
                                                 launchOptions:nil];
    weakBridge = view.bridge;
    XCTAssertNotNil(weakBridge, @"RCTBridge should have been created");
    (void)view;
  }

  XCTAssertNil(weakBridge, @"RCTBridge should have been deallocated");
}

- (void)testModulesAreInvalidated
{
  AllocationTestModule *module = [AllocationTestModule new];
  @autoreleasepool {
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                              moduleProvider:^{ return @[module]; }
                                               launchOptions:nil];
    XCTAssertTrue(module.isValid, @"AllocationTestModule should be valid");
    (void)bridge;
  }

  RCT_RUN_RUNLOOP_WHILE(module.isValid)
  XCTAssertFalse(module.isValid, @"AllocationTestModule should have been invalidated by the bridge");
}

- (void)testModulesAreDeallocated
{
  __weak AllocationTestModule *weakModule;
  @autoreleasepool {
    AllocationTestModule *module = [AllocationTestModule new];
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                              moduleProvider:^{ return @[module]; }
                                               launchOptions:nil];
    XCTAssertNotNil(module, @"AllocationTestModule should have been created");
    weakModule = module;
    (void)bridge;
  }

  RCT_RUN_RUNLOOP_WHILE(weakModule)
  XCTAssertNil(weakModule, @"AllocationTestModule should have been deallocated");
}

- (void)testModuleMethodsAreDeallocated
{
  static RCTMethodInfo methodInfo = {
    .objcName = "test:(NSString *)a :(nonnull NSNumber *)b :(RCTResponseSenderBlock)c :(RCTResponseErrorBlock)d",
    .jsName = "",
    .isSync = false
  };

  __weak RCTModuleMethod *weakMethod;
  @autoreleasepool {
    __autoreleasing RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithExportedMethod:&methodInfo
                                                                                  moduleClass:[AllocationTestModule class]];
    XCTAssertNotNil(method, @"RCTModuleMethod should have been created");
    weakMethod = method;
  }

  RCT_RUN_RUNLOOP_WHILE(weakMethod)
  XCTAssertNil(weakMethod, @"RCTModuleMethod should have been deallocated");
}

- (void)testContentViewIsInvalidated
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                            moduleProvider:nil
                                             launchOptions:nil];
  __weak UIView *rootContentView;
  @autoreleasepool {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"" initialProperties:nil];
    RCT_RUN_RUNLOOP_WHILE(!(rootContentView = [rootView valueForKey:@"contentView"]))
    XCTAssertTrue(rootContentView.userInteractionEnabled, @"RCTContentView should be valid");
    (void)rootView;
  }

#if !TARGET_OS_TV // userInteractionEnabled is true for Apple TV views
  XCTAssertFalse(rootContentView.userInteractionEnabled, @"RCTContentView should have been invalidated");
#endif
}

/**
 * T42930872:
 *
 * Both bridge invalidation and bridge setUp occurr execute concurrently.
 * Therefore, it's not safe for us to create a bridge, and immediately reload on
 * it. It's also unsafe to just reload the bridge, because that calls invalidate
 * and then setUp. Because of these race conditions, this test may randomly
 * crash. Hence, we should disable this test until we either fix the bridge
 * or delete it.
 */
- (void)disabled_testUnderlyingBridgeIsDeallocated
{
  RCTBridge *bridge;
  __weak id batchedBridge;
  @autoreleasepool {
    bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL moduleProvider:nil launchOptions:nil];
    batchedBridge = bridge.batchedBridge;
    XCTAssertTrue([batchedBridge isValid], @"RCTBridge impl should be valid");
    [bridge reload];
  }

  RCT_RUN_RUNLOOP_WHILE(batchedBridge != nil)

  XCTAssertNotNil(bridge, @"RCTBridge should not have been deallocated");
  XCTAssertNil(batchedBridge, @"RCTBridge impl should have been deallocated");

  // Wait to complete the test until the new bridge impl is also deallocated
  @autoreleasepool {
    batchedBridge = bridge.batchedBridge;
    [bridge invalidate];
    bridge = nil;
  }

  RCT_RUN_RUNLOOP_WHILE(batchedBridge != nil);
  XCTAssertNil(batchedBridge);
}

@end
