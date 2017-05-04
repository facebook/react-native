/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTUtils.h>

static const NSUInteger kNameIndex = 0;
static const NSUInteger kConstantsIndex = 1;
static const NSUInteger kMethodsIndex = 2;

@interface TestExecutor : NSObject <RCTJavaScriptExecutor>

@property (nonatomic, readonly, copy) NSMutableDictionary<NSString *, id> *injectedStuff;

@end

@implementation TestExecutor

@synthesize valid = _valid;

RCT_EXPORT_MODULE()

- (void)setUp {}

- (instancetype)init
{
  if (self = [super init]) {
    _injectedStuff = [NSMutableDictionary dictionary];
  }
  return self;
}

- (BOOL)isValid
{
  return _valid;
}

- (void)flushedQueue:(RCTJavaScriptCallback)onComplete
{
  onComplete(nil, nil);
}

- (void)callFunctionOnModule:(__unused NSString *)module
                      method:(__unused NSString *)method
                   arguments:(__unused NSArray *)args
                    callback:(RCTJavaScriptCallback)onComplete
{
  onComplete(nil, nil);
}

- (void)invokeCallbackID:(__unused NSNumber *)cbID
               arguments:(__unused NSArray *)args
                callback:(RCTJavaScriptCallback)onComplete
{
  onComplete(nil, nil);
}

- (void)executeApplicationScript:(__unused NSString *)script
                       sourceURL:(__unused NSURL *)url
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  onComplete(nil);
}

- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  block();
}

- (void)executeAsyncBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  block();
}

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete
{
  _injectedStuff[objectName] = script;
  onComplete(nil);
}

- (void)invalidate
{
  _valid = NO;
}

@end

// Define a module that is not explicitly registered with RCT_EXPORT_MODULE
@interface UnregisteredTestModule : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL testMethodCalled;

@end

@implementation UnregisteredTestModule

@synthesize methodQueue = _methodQueue;

+ (NSString *)moduleName
{
  return @"UnregisteredTestModule";
}

RCT_EXPORT_METHOD(testMethod)
{
  _testMethodCalled = YES;
}

@end

@interface RCTBridgeTests : XCTestCase <RCTBridgeModule>
{
  RCTBridge *_bridge;
  __weak TestExecutor *_jsExecutor;

  BOOL _testMethodCalled;
  UnregisteredTestModule *_unregisteredTestModule;
}
@end

@implementation RCTBridgeTests

@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE(TestModule)

- (void)setUp
{
  [super setUp];

  _unregisteredTestModule = [UnregisteredTestModule new];
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  _bridge = [[RCTBridge alloc] initWithBundleURL:[bundle URLForResource:@"RNTesterUnitTestsBundle" withExtension:@"js"]
                                  moduleProvider:^{ return @[self, self->_unregisteredTestModule]; }
                                   launchOptions:nil];

  _bridge.executorClass = [TestExecutor class];

  // Force to recreate the executor with the new class
  // - reload: doesn't work here since bridge hasn't loaded yet.
  [_bridge invalidate];
  [_bridge setUp];

  _jsExecutor = _bridge.batchedBridge.javaScriptExecutor;
  XCTAssertNotNil(_jsExecutor);
}

- (void)tearDown
{
  [super tearDown];

  _testMethodCalled = NO;

  [_bridge invalidate];
  RCT_RUN_RUNLOOP_WHILE(_jsExecutor.isValid);
  _bridge = nil;
}

- (void)testHookRegistration
{
  NSString *injectedStuff;
  RCT_RUN_RUNLOOP_WHILE(!(injectedStuff = _jsExecutor.injectedStuff[@"__fbBatchedBridgeConfig"]));
  XCTAssertNotNil(injectedStuff);

  __block NSNumber *testModuleID = nil;
  __block NSDictionary<NSString *, id> *testConstants = nil;
  __block NSNumber *testMethodID = nil;

  NSArray *remoteModuleConfig = RCTJSONParse(injectedStuff, NULL)[@"remoteModuleConfig"];
  [remoteModuleConfig enumerateObjectsUsingBlock:^(id moduleConfig, NSUInteger i, BOOL *stop) {
    if ([moduleConfig isKindOfClass:[NSArray class]] && [moduleConfig[kNameIndex] isEqualToString:@"TestModule"]) {
      testModuleID = @(i);
      testConstants = moduleConfig[kConstantsIndex];
      testMethodID = @([moduleConfig[kMethodsIndex] indexOfObject:@"testMethod"]);
      *stop = YES;
    }
  }];

  XCTAssertNotNil(remoteModuleConfig);
  XCTAssertNotNil(testModuleID);
  XCTAssertNotNil(testConstants);
  XCTAssertEqualObjects(testConstants[@"eleventyMillion"], @42);
  XCTAssertNotNil(testMethodID);
}

- (void)testCallNativeMethod
{
  NSString *injectedStuff;
  RCT_RUN_RUNLOOP_WHILE(!(injectedStuff = _jsExecutor.injectedStuff[@"__fbBatchedBridgeConfig"]));
  XCTAssertNotNil(injectedStuff);

  __block NSNumber *testModuleID = nil;
  __block NSNumber *testMethodID = nil;

  NSArray *remoteModuleConfig = RCTJSONParse(injectedStuff, NULL)[@"remoteModuleConfig"];
  [remoteModuleConfig enumerateObjectsUsingBlock:^(id moduleConfig, NSUInteger i, __unused BOOL *stop) {
    if ([moduleConfig isKindOfClass:[NSArray class]] && [moduleConfig[kNameIndex] isEqualToString:@"TestModule"]) {
      testModuleID = @(i);
      testMethodID = @([moduleConfig[kMethodsIndex] indexOfObject:@"testMethod"]);
      *stop = YES;
    }
  }];

  XCTAssertNotNil(testModuleID);
  XCTAssertNotNil(testMethodID);

  NSArray *args = @[@1234, @5678, @"stringy", @{@"a": @1}, @42];
  NSArray *buffer = @[@[testModuleID], @[testMethodID], @[args]];

  [_bridge.batchedBridge handleBuffer:buffer batchEnded:YES];

  dispatch_sync(_methodQueue, ^{
    // clear the queue
    XCTAssertTrue(self->_testMethodCalled);
  });
}

- (void)testCallUnregisteredModuleMethod
{
  NSString *injectedStuff;
  RCT_RUN_RUNLOOP_WHILE(!(injectedStuff = _jsExecutor.injectedStuff[@"__fbBatchedBridgeConfig"]));
  XCTAssertNotNil(injectedStuff);

  __block NSNumber *testModuleID = nil;
  __block NSNumber *testMethodID = nil;

  NSArray *remoteModuleConfig = RCTJSONParse(injectedStuff, NULL)[@"remoteModuleConfig"];
  [remoteModuleConfig enumerateObjectsUsingBlock:^(id moduleConfig, NSUInteger i, __unused BOOL *stop) {
    if ([moduleConfig isKindOfClass:[NSArray class]] && [moduleConfig[kNameIndex] isEqualToString:@"UnregisteredTestModule"]) {
      testModuleID = @(i);
      testMethodID = @([moduleConfig[kMethodsIndex] indexOfObject:@"testMethod"]);
      *stop = YES;
    }
  }];

  XCTAssertNotNil(testModuleID);
  XCTAssertNotNil(testMethodID);

  NSArray *args = @[];
  NSArray *buffer = @[@[testModuleID], @[testMethodID], @[args]];

  [_bridge.batchedBridge handleBuffer:buffer batchEnded:YES];

  dispatch_sync(_unregisteredTestModule.methodQueue, ^{
    XCTAssertTrue(self->_unregisteredTestModule.testMethodCalled);
  });
}

- (void)DISABLED_testBadArgumentsCount
{
  //NSArray *bufferWithMissingArgument = @[@[@1], @[@0], @[@[@1234, @5678, @"stringy", @{@"a": @1}/*, @42*/]], @[], @1234567];
  //[_bridge handleBuffer:bufferWithMissingArgument];
  NSLog(@"WARNING: testBadArgumentsCount is temporarily disabled until we have a better way to test cases that we expect to trigger redbox errors");
}

RCT_EXPORT_METHOD(testMethod:(NSInteger)integer
                  number:(nonnull NSNumber *)number
                  string:(NSString *)string
                  dictionary:(NSDictionary *)dict
                  callback:(RCTResponseSenderBlock)callback)
{
  _testMethodCalled = YES;

  XCTAssertTrue(integer == 1234);
  XCTAssertEqualObjects(number, @5678);
  XCTAssertEqualObjects(string, @"stringy");
  XCTAssertEqualObjects(dict, @{@"a": @1});
  XCTAssertNotNil(callback);
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"eleventyMillion": @42};
}

@end
