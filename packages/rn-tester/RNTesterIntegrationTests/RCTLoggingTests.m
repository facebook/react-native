/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTLog.h>

// Time to wait for an expected log statement to show before failing the test
const int64_t LOGGER_TIMEOUT = 10 * NSEC_PER_SEC;

@interface RCTLoggingTests : XCTestCase

@end

@implementation RCTLoggingTests {
  RCTBridge *_bridge;

  dispatch_semaphore_t _logSem;
  RCTLogLevel _lastLogLevel;
  RCTLogSource _lastLogSource;
  NSString *_lastLogMessage;
}

- (void)setUp
{
  NSURL *scriptURL;
  if (getenv("CI_USE_PACKAGER")) {
    NSString *app = @"IntegrationTests/IntegrationTestsApp";
    scriptURL =
        [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true", app]];
  } else {
    scriptURL = [[NSBundle bundleForClass:[RCTBridge class]] URLForResource:@"main" withExtension:@"jsbundle"];
  }
  RCTAssert(scriptURL != nil, @"No scriptURL set");

  _bridge = [[RCTBridge alloc] initWithBundleURL:scriptURL moduleProvider:NULL launchOptions:nil];
  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:60];
  while (date.timeIntervalSinceNow > 0 && _bridge.loading) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  XCTAssertFalse(_bridge.loading);

  _logSem = dispatch_semaphore_create(0);

  // Set the log function to signal the semaphore
  RCTSetLogFunction(
      ^(RCTLogLevel level,
        RCTLogSource source,
        __unused NSString *fileName,
        __unused NSNumber *lineNumber,
        NSString *message) {
        if (source == RCTLogSourceJavaScript) {
          self->_lastLogLevel = level;
          self->_lastLogSource = source;
          self->_lastLogMessage = message;
          dispatch_semaphore_signal(self->_logSem);
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
  intptr_t waitRet = 0;

  // First queue the marker and spin until it happens to be logged.
  // This is to ensure we skip all of the other messages, that were logged earlier.
  NSString *const LogMarker = @"===LOG_MARKER===";
  [_bridge enqueueJSCall:@"LoggingTestModule.logToConsole" args:@[ LogMarker ]];

  do {
    waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
    XCTAssertEqual(waitRet, 0, @"Timed out waiting for log marker");
  } while (waitRet == 0 && ![_lastLogMessage isEqualToString:LogMarker]);

  [_bridge enqueueJSCall:@"LoggingTestModule.logToConsole" args:@[ @"Invoking console.log" ]];
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for logToConsole");

  XCTAssertEqual(_lastLogLevel, RCTLogLevelInfo);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invoking console.log");

  [_bridge enqueueJSCall:@"LoggingTestModule.warning" args:@[ @"Generating warning" ]];
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for warning");

  XCTAssertEqual(_lastLogLevel, RCTLogLevelWarning);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Generating warning");

  [_bridge enqueueJSCall:@"LoggingTestModule.invariant" args:@[ @"Invariant failed" ]];
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for invariant");

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertTrue([_lastLogMessage containsString:@"Invariant Violation: Invariant failed"]);

  [_bridge enqueueJSCall:@"LoggingTestModule.logErrorToConsole" args:@[ @"Invoking console.error" ]];
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for logErrorToConsole");

  // For local bundles, we may first get a warning about symbolication
  if (![_lastLogMessage isEqualToString:@"Invoking console.error"]) {
    waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
    XCTAssertEqual(waitRet, 0, @"Timed out waiting for logErrorToConsole #2");
  }

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invoking console.error");

  [_bridge enqueueJSCall:@"LoggingTestModule.throwError" args:@[ @"Throwing an error" ]];
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for throwError");

  // For local bundles, we may first get a warning about symbolication
  if (![_lastLogMessage containsString:@"Error: Throwing an error"]) {
    waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
    XCTAssertEqual(waitRet, 0, @"Timed out waiting for throwError #2");
  }

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertTrue([_lastLogMessage containsString:@"Error: Throwing an error"]);
}

@end
