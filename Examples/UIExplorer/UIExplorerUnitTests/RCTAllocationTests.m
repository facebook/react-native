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
#import "RCTContextExecutor.h"
#import "RCTRootView.h"

#define RUN_RUNLOOP_WHILE(CONDITION) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
NSDate *timeout = [[NSDate date] dateByAddingTimeInterval:0.1]; \
while ((CONDITION) && [timeout timeIntervalSinceNow] > 0) { \
  [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:timeout]; \
} \
_Pragma("clang diagnostic pop")

@interface RCTBridge (RCTAllocationTests)

@property (nonatomic, weak) RCTBridge *batchedBridge;

@end

@interface RCTJavaScriptContext : NSObject

@property (nonatomic, assign, readonly) JSGlobalContextRef ctx;

@end

@interface AllocationTestModule : NSObject<RCTBridgeModule, RCTInvalidating>
@end

@implementation AllocationTestModule

RCT_EXPORT_MODULE();

@synthesize valid = _valid;

- (id)init
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

@end

@interface RCTAllocationTests : XCTestCase
@end

@implementation RCTAllocationTests

- (void)testBridgeIsDeallocated
{
  __weak RCTBridge *weakBridge;
  @autoreleasepool {
    RCTRootView *view = [[RCTRootView alloc] initWithBundleURL:nil
                                                    moduleName:@""
                                                 launchOptions:nil];
    weakBridge = view.bridge;
    XCTAssertNotNil(weakBridge, @"RCTBridge should have been created");
    (void)view;
  }

  XCTAssertNil(weakBridge, @"RCTBridge should have been deallocated");
}

- (void)testModulesAreInvalidated
{
  AllocationTestModule *module = [[AllocationTestModule alloc] init];
  @autoreleasepool {
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:nil
                                              moduleProvider:^{
                                                return @[module];
                                              }
                                               launchOptions:nil];
    XCTAssertTrue(module.isValid, @"AllocationTestModule should be valid");
    (void)bridge;
  }

  /**
   * Sleep on the main thread to allow js thread deallocations then run the runloop
   * to allow the module to be deallocated on the main thread
   */
  RUN_RUNLOOP_WHILE(module.isValid)
  XCTAssertFalse(module.isValid, @"AllocationTestModule should have been invalidated by the bridge");
}

- (void)testModulesAreDeallocated
{
  __weak AllocationTestModule *weakModule;
  @autoreleasepool {
    AllocationTestModule *module = [[AllocationTestModule alloc] init];
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:nil
                                moduleProvider:^{
                                  return @[module];
                                }
                                 launchOptions:nil];
    weakModule = module;
    XCTAssertNotNil(weakModule, @"AllocationTestModule should have been created");
    (void)bridge;
  }

  RUN_RUNLOOP_WHILE(weakModule)
  XCTAssertNil(weakModule, @"AllocationTestModule should have been deallocated");
}

- (void)testJavaScriptExecutorIsDeallocated
{
  __weak id<RCTJavaScriptExecutor> weakExecutor;
  @autoreleasepool {
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:nil
                                              moduleProvider:nil
                                               launchOptions:nil];
    weakExecutor = [bridge.batchedBridge valueForKey:@"javaScriptExecutor"];
    XCTAssertNotNil(weakExecutor, @"JavaScriptExecutor should have been created");
    (void)bridge;
  }

  RUN_RUNLOOP_WHILE(weakExecutor);
  XCTAssertNil(weakExecutor, @"JavaScriptExecutor should have been released");
}

- (void)testJavaScriptContextIsDeallocated
{
  __weak id weakContext;
  @autoreleasepool {
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:nil
                                              moduleProvider:nil
                                               launchOptions:nil];
    id executor = [bridge.batchedBridge valueForKey:@"javaScriptExecutor"];
    RUN_RUNLOOP_WHILE(!(weakContext = [executor valueForKey:@"context"]));
    XCTAssertNotNil(weakContext, @"RCTJavaScriptContext should have been created");
    (void)bridge;
  }

  RUN_RUNLOOP_WHILE(weakContext);
  XCTAssertNil(weakContext, @"RCTJavaScriptContext should have been deallocated");
}

- (void)testContentViewIsInvalidated
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:nil
                                            moduleProvider:nil
                                             launchOptions:nil];
  __weak id rootContentView;
  @autoreleasepool {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@""];
    RUN_RUNLOOP_WHILE(!(rootContentView = [rootView valueForKey:@"contentView"]))
    XCTAssertTrue([rootContentView isValid], @"RCTContentView should be valid");
    (void)rootView;
  }

  XCTAssertFalse([rootContentView isValid], @"RCTContentView should have been invalidated");
}

- (void)testUnderlyingBridgeIsDeallocated
{
  RCTBridge *bridge;
  __weak id batchedBridge;
  @autoreleasepool {
    bridge = [[RCTBridge alloc] initWithBundleURL:nil moduleProvider:nil launchOptions:nil];
    batchedBridge = bridge.batchedBridge;
    XCTAssertTrue([batchedBridge isValid], @"RCTBatchedBridge should be valid");
    [bridge reload];
  }

  RUN_RUNLOOP_WHILE(batchedBridge != nil)

  XCTAssertNotNil(bridge, @"RCTBridge should not have been deallocated");
  XCTAssertNil(batchedBridge, @"RCTBatchedBridge should have been deallocated");
}

@end
