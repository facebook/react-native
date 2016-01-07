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

#import <XCTest/XCTest.h>

#import "RCTAssert.h"
#import "RCTLog.h"
#import "RCTBridge.h"

@interface RCTLoggingTests : XCTestCase

@end

@implementation RCTLoggingTests
{
  RCTBridge *_bridge;

  dispatch_semaphore_t _logSem;
  RCTLogLevel _lastLogLevel;
  RCTLogSource _lastLogSource;
  NSString *_lastLogMessage;
}

- (void)setUp
{
#if RUNNING_ON_CI
  NSURL *scriptURL = [[NSBundle bundleForClass:[RCTBridge class]] URLForResource:@"main" withExtension:@"jsbundle"];
  RCTAssert(scriptURL != nil, @"Could not locate main.jsBundle");
#else
  NSString *app = @"Examples/UIExplorer/UIExplorerIntegrationTests/js/IntegrationTestsApp";
  NSURL *scriptURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true", app]];
#endif

  _bridge = [[RCTBridge alloc] initWithBundleURL:scriptURL moduleProvider:NULL launchOptions:nil];
  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:5];
  while (date.timeIntervalSinceNow > 0 && _bridge.loading) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  XCTAssertFalse(_bridge.loading);

  _logSem = dispatch_semaphore_create(0);
  RCTSetLogFunction(^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
    if (source == RCTLogSourceJavaScript) {
      _lastLogLevel = level;
      _lastLogSource = source;
      _lastLogMessage = message;
      dispatch_semaphore_signal(_logSem);
    }
  });
}

- (void)tearDown
{
  [_bridge invalidate];
  _bridge = nil;

  RCTSetLogFunction(RCTDefaultLogFunction);
}

- (void)testLogging
{
  [_bridge enqueueJSCall:@"LoggingTestModule.logToConsole" args:@[@"Invoking console.log"]];
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);

  XCTAssertEqual(_lastLogLevel, RCTLogLevelInfo);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invoking console.log");

  [_bridge enqueueJSCall:@"LoggingTestModule.warning" args:@[@"Generating warning"]];
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);

  XCTAssertEqual(_lastLogLevel, RCTLogLevelWarning);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Warning: Generating warning");

  [_bridge enqueueJSCall:@"LoggingTestModule.invariant" args:@[@"Invariant failed"]];
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invariant failed");

  [_bridge enqueueJSCall:@"LoggingTestModule.logErrorToConsole" args:@[@"Invoking console.error"]];
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invoking console.error");

  [_bridge enqueueJSCall:@"LoggingTestModule.throwError" args:@[@"Throwing an error"]];
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Throwing an error");
}

@end
