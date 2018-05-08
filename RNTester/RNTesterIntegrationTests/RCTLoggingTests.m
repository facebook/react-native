/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTLog.h>

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
  NSURL *scriptURL;
  if (getenv("CI_USE_PACKAGER")) {
    NSString *app = @"IntegrationTests/IntegrationTestsApp";
    scriptURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true", app]];
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
}

- (void)tearDown
{
  [_bridge invalidate];
  _bridge = nil;

  RCTSetLogFunction(RCTDefaultLogFunction);
}

- (void)testLogging
{
  // First console log call will fire after 2.0 sec, to allow for any initial log messages
  // that might come in (seeing this in tvOS)
  [_bridge enqueueJSCall:@"LoggingTestModule.logToConsoleAfterWait" args:@[@"Invoking console.log",@2000]];
  // Spin native layer for 1.9 sec
  [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:1.9]];
  // Now set the log function to signal the semaphore
  RCTSetLogFunction(^(RCTLogLevel level, RCTLogSource source, __unused NSString *fileName, __unused NSNumber *lineNumber, NSString *message) {
    if (source == RCTLogSourceJavaScript) {
      self->_lastLogLevel = level;
      self->_lastLogSource = source;
      self->_lastLogMessage = message;
      dispatch_semaphore_signal(self->_logSem);
    }
  });
  // Wait for console log to signal the semaphore
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

  // For local bundles, we'll first get a warning about symbolication
  if ([_bridge.bundleURL isFileURL]) {
    dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
  }

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invoking console.error");

  [_bridge enqueueJSCall:@"LoggingTestModule.throwError" args:@[@"Throwing an error"]];
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);

  // For local bundles, we'll first get a warning about symbolication
  if ([_bridge.bundleURL isFileURL]) {
    dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
  }

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Throwing an error");
}

@end
