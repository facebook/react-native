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
#import "RCTBridge+Private.h"
#import "RCTBridgeModule.h"
#import "RCTUtils.h"
#import "RCTUIManager.h"
#import "RCTViewManager.h"

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

@interface RCTTestViewManager : RCTViewManager
@end

@implementation RCTTestViewManager

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)customDirectEventTypes
{
  return @[@"foo"];
}

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
  return nil;
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
}

- (void)tearDown
{
  [super tearDown];

  _notificationObserver = nil;
  id<RCTJavaScriptExecutor> jsExecutor = _bridge.batchedBridge.javaScriptExecutor;
  [_bridge invalidate];
  RUN_RUNLOOP_WHILE(jsExecutor.isValid);
  _bridge = nil;
}

- (void)testViewManagerNotInitializedBeforeSetBridgeModule
{
  RUN_RUNLOOP_WHILE(!_notificationObserver.didDetectViewManagerInit);
}

@end
