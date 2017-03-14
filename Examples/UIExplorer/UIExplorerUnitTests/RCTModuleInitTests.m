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

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTUtils.h>

#define RUN_RUNLOOP_WHILE(CONDITION) \
{ \
  NSDate *timeout = [NSDate dateWithTimeIntervalSinceNow:5]; \
  while ((CONDITION)) { \
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]]; \
    if ([timeout timeIntervalSinceNow] <= 0) { \
      XCTFail(@"Runloop timed out before condition was met"); \
      break; \
    } \
  } \
}


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
  return [bundle URLForResource:@"UIExplorerUnitTestsBundle" withExtension:@"js"];
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

  id<RCTJavaScriptExecutor> jsExecutor = _bridge.batchedBridge.javaScriptExecutor;
  [_bridge invalidate];
  RUN_RUNLOOP_WHILE(jsExecutor.isValid);
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
  RUN_RUNLOOP_WHILE(!_injectedModuleInitNotificationSent);
  XCTAssertTrue(_injectedModuleInitNotificationSent);
}

- (void)testCustomInitModuleInitializedAtBridgeStartup
{
  RUN_RUNLOOP_WHILE(!_customInitModuleNotificationSent);
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

  RUN_RUNLOOP_WHILE(!module);
  XCTAssertTrue(_customSetBridgeModuleNotificationSent);
  XCTAssertFalse(module.setBridgeOnMainQueue);
  XCTAssertEqual(module.bridge, _bridge.batchedBridge);
  XCTAssertNotNil(module.methodQueue);
}

- (void)testExportConstantsModuleInitializedAtBridgeStartup
{
  RUN_RUNLOOP_WHILE(!_exportConstantsModuleNotificationSent);
  XCTAssertTrue(_exportConstantsModuleNotificationSent);
  RCTTestExportConstantsModule *module = [_bridge moduleForClass:[RCTTestExportConstantsModule class]];
  RUN_RUNLOOP_WHILE(!module.exportedConstants);
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

  RUN_RUNLOOP_WHILE(!module);
  XCTAssertTrue(_lazyInitModuleNotificationSent);
  XCTAssertFalse(_lazyInitModuleNotificationSentOnMainQueue);
  XCTAssertNotNil(module);
  XCTAssertEqual(module.bridge, _bridge.batchedBridge);
  XCTAssertNotNil(module.methodQueue);
}

@end
