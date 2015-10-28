/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import "RCTBridge.h"
#import "RCTBridgeModule.h"
#import "RCTJavaScriptExecutor.h"
#import "RCTUtils.h"

@interface RCTBridge (Testing)

@property (nonatomic, strong, readonly) RCTBridge *batchedBridge;

- (void)handleBuffer:(id)buffer;
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
}
@end

@implementation RCTBridgeTests

@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE(TestModule)

- (void)setUp
{
  [super setUp];

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

#define RUN_RUNLOOP_WHILE(CONDITION) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
NSDate *timeout = [[NSDate date] dateByAddingTimeInterval:0.1]; \
while ((CONDITION) && [timeout timeIntervalSinceNow] > 0) { \
  [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:timeout]; \
} \
_Pragma("clang diagnostic pop")

- (void)testHookRegistration
{
  TestExecutor *executor =  [_bridge.batchedBridge valueForKey:@"_javaScriptExecutor"];

  NSString *injectedStuff;
  RUN_RUNLOOP_WHILE(!(injectedStuff = executor.injectedStuff[@"__fbBatchedBridgeConfig"]));

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

  NSString *injectedStuff;
  RUN_RUNLOOP_WHILE(!(injectedStuff = executor.injectedStuff[@"__fbBatchedBridgeConfig"]));

  NSDictionary *moduleConfig = RCTJSONParse(injectedStuff, NULL);
  NSDictionary *remoteModuleConfig = moduleConfig[@"remoteModuleConfig"];
  NSDictionary *testModuleConfig = remoteModuleConfig[@"TestModule"];
  NSNumber *testModuleID = testModuleConfig[@"moduleID"];
  NSDictionary *methods = testModuleConfig[@"methods"];
  NSDictionary *testMethod = methods[@"testMethod"];
  NSNumber *testMethodID = testMethod[@"methodID"];

  NSArray *args = @[@1234, @5678, @"stringy", @{@"a": @1}, @42];
  NSArray *buffer = @[@[testModuleID], @[testMethodID], @[args], @[], @1234567];

  [_bridge.batchedBridge handleBuffer:buffer];

  dispatch_sync(_methodQueue, ^{
    // clear the queue
    XCTAssertTrue(_testMethodCalled);
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

- (NSDictionary *)constantsToExport
{
  return @{@"eleventyMillion": @42};
}

@end
