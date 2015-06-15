// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import "RCTBridge.h"
#import "RCTBridgeModule.h"
#import "RCTJavaScriptExecutor.h"
#import "RCTUtils.h"

@interface RCTBridge (Testing)

@property (nonatomic, strong, readonly) RCTBridge *batchedBridge;

- (void)_handleBuffer:(id)buffer context:(NSNumber *)context;
- (void)setUp;

@end

@interface TestExecutor : NSObject <RCTJavaScriptExecutor>

@property (nonatomic, readonly, copy) NSMutableDictionary *injectedStuff;

@end

@implementation TestExecutor

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
  return YES;
}

- (void)executeJSCall:(__unused NSString *)name
               method:(__unused NSString *)method
            arguments:(__unused NSArray *)arguments
              context:(__unused NSNumber *)executorID
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

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete
{
  _injectedStuff[objectName] = script;
  onComplete(nil);
}

- (void)invalidate {}

@end

@interface RCTBridgeTests : XCTestCase <RCTBridgeModule>
{
  RCTBridge *_bridge;
  BOOL _testMethodCalled;
  dispatch_queue_t _queue;
}
@end

@implementation RCTBridgeTests

RCT_EXPORT_MODULE(TestModule)

- (dispatch_queue_t)methodQueue
{
  return _queue;
}

- (void)setUp
{
  [super setUp];

  _queue = dispatch_queue_create("com.facebook.React.TestQueue", DISPATCH_QUEUE_SERIAL);

  _bridge = [[RCTBridge alloc] initWithBundleURL:nil
                                  moduleProvider:^{ return @[self]; }
                                   launchOptions:nil];

  _bridge.executorClass = [TestExecutor class];
  // Force to recreate the executor with the new class
  // - reload: doesn't work here since bridge hasn't loaded yet.
  [_bridge invalidate];
  [_bridge setUp];
}

- (void)tearDown
{
  [super tearDown];
  [_bridge invalidate];
}

- (void)testHookRegistration
{
  TestExecutor *executor =  [_bridge.batchedBridge valueForKey:@"_javaScriptExecutor"];
  NSString *injectedStuff = executor.injectedStuff[@"__fbBatchedBridgeConfig"];
  NSDictionary *moduleConfig = RCTJSONParse(injectedStuff, NULL);
  NSDictionary *remoteModuleConfig = moduleConfig[@"remoteModuleConfig"];
  NSDictionary *testModuleConfig = remoteModuleConfig[@"TestModule"];
  NSDictionary *constants = testModuleConfig[@"constants"];
  NSDictionary *methods = testModuleConfig[@"methods"];

  XCTAssertNotNil(moduleConfig);
  XCTAssertNotNil(remoteModuleConfig);
  XCTAssertNotNil(testModuleConfig);
  XCTAssertNotNil(constants);
  XCTAssertEqualObjects(constants[@"eleventyMillion"], @42);
  XCTAssertNotNil(methods);
  XCTAssertNotNil(methods[@"testMethod"]);
}

- (void)testCallNativeMethod
{
  TestExecutor *executor =  [_bridge.batchedBridge valueForKey:@"_javaScriptExecutor"];
  NSString *injectedStuff = executor.injectedStuff[@"__fbBatchedBridgeConfig"];
  NSDictionary *moduleConfig = RCTJSONParse(injectedStuff, NULL);
  NSDictionary *remoteModuleConfig = moduleConfig[@"remoteModuleConfig"];
  NSDictionary *testModuleConfig = remoteModuleConfig[@"TestModule"];
  NSNumber *testModuleID = testModuleConfig[@"moduleID"];
  NSDictionary *methods = testModuleConfig[@"methods"];
  NSDictionary *testMethod = methods[@"testMethod"];
  NSNumber *testMethodID = testMethod[@"methodID"];

  NSArray *args = @[@1234, @5678, @"stringy", @{@"a": @1}, @42];
  NSArray *buffer = @[@[testModuleID], @[testMethodID], @[args], @[], @1234567];

  [_bridge.batchedBridge _handleBuffer:buffer context:RCTGetExecutorID(executor)];

  dispatch_sync(_queue, ^{
    // clear the queue
    XCTAssertTrue(_testMethodCalled);
  });
}

- (void)DISABLED_testBadArgumentsCount
{
  //NSArray *bufferWithMissingArgument = @[@[@1], @[@0], @[@[@1234, @5678, @"stringy", @{@"a": @1}/*, @42*/]], @[], @1234567];
  //[_bridge _handleBuffer:bufferWithMissingArgument];
  NSLog(@"WARNING: testBadArgumentsCount is temporarily disabled until we have a better way to test cases that we expect to trigger redbox errors");
}

RCT_EXPORT_METHOD(testMethod:(NSInteger)integer
                  number:(NSNumber *)number
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

- (NSDictionary *)constantsToExport
{
  return @{@"eleventyMillion": @42};
}

@end
