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
    NSString *bundlePrefix = [[[NSBundle mainBundle] infoDictionary] valueForKey:@"RN_BUNDLE_PREFIX"];
    if (bundlePrefix == nil) { // [macOS There's a convoluted crash if the bundler prefix is null, meaning
                               // the RN_BUNDLE_PREFIX wasn't set. New platforms won't have this set and don't need it
                               // to run, so default to a reasonable fallback.
      bundlePrefix = @"";
    } // macOS]
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

<<<<<<< HEAD
- (void)tearDown
{
  [_bridge invalidate];
  _bridge = nil;

  RCTSetLogFunction(RCTDefaultLogFunction);
}

#define RCT_TEST_LOGGING_TIMEOUT dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 15) // [macOS]

- (void)testLogging
{
  // First console log call will fire after 2.0 sec, to allow for any initial log messages
  // that might come in (seeing this in tvOS)
  [_bridge enqueueJSCall:@"LoggingTestModule.logToConsoleAfterWait" args:@[ @"Invoking console.log", @2000 ]];
  // Spin native layer for 1.9 sec
  [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:1.9]];
  // Now set the log function to signal the semaphore
||||||| 49f3f47b1e9
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
  [_bridge enqueueJSCall:@"LoggingTestModule.logToConsoleAfterWait" args:@[ @"Invoking console.log", @2000 ]];
  // Spin native layer for 1.9 sec
  [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:1.9]];
  // Now set the log function to signal the semaphore
=======
  // Set the log function to signal the semaphore
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af
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
<<<<<<< HEAD
  // Wait for console log to signal the semaphore
  dispatch_semaphore_wait(_logSem, RCT_TEST_LOGGING_TIMEOUT); // [macOS]
||||||| 49f3f47b1e9
  // Wait for console log to signal the semaphore
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
=======
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
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af

  XCTAssertEqual(_lastLogLevel, RCTLogLevelInfo);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invoking console.log");

  [_bridge enqueueJSCall:@"LoggingTestModule.warning" args:@[ @"Generating warning" ]];
<<<<<<< HEAD
  dispatch_semaphore_wait(_logSem, RCT_TEST_LOGGING_TIMEOUT); // [macOS]
||||||| 49f3f47b1e9
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
=======
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for warning");
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af

  XCTAssertEqual(_lastLogLevel, RCTLogLevelWarning);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Generating warning");

  [_bridge enqueueJSCall:@"LoggingTestModule.invariant" args:@[ @"Invariant failed" ]];
<<<<<<< HEAD
  dispatch_semaphore_wait(_logSem, RCT_TEST_LOGGING_TIMEOUT); // [macOS]
||||||| 49f3f47b1e9
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
=======
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for invariant");
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertTrue([_lastLogMessage containsString:@"Invariant Violation: Invariant failed"]);

  [_bridge enqueueJSCall:@"LoggingTestModule.logErrorToConsole" args:@[ @"Invoking console.error" ]];
<<<<<<< HEAD
  dispatch_semaphore_wait(_logSem, RCT_TEST_LOGGING_TIMEOUT); // [macOS]
||||||| 49f3f47b1e9
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
=======
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for logErrorToConsole");
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af

<<<<<<< HEAD
  // For local bundles, we'll first get a warning about symbolication
  if ([_bridge.bundleURL isFileURL]) {
    dispatch_semaphore_wait(_logSem, RCT_TEST_LOGGING_TIMEOUT); // [macOS]
||||||| 49f3f47b1e9
  // For local bundles, we'll first get a warning about symbolication
  if ([_bridge.bundleURL isFileURL]) {
    dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
=======
  // For local bundles, we may first get a warning about symbolication
  if (![_lastLogMessage isEqualToString:@"Invoking console.error"]) {
    waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
    XCTAssertEqual(waitRet, 0, @"Timed out waiting for logErrorToConsole #2");
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af
  }

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertEqualObjects(_lastLogMessage, @"Invoking console.error");

  [_bridge enqueueJSCall:@"LoggingTestModule.throwError" args:@[ @"Throwing an error" ]];
<<<<<<< HEAD
  dispatch_semaphore_wait(_logSem, RCT_TEST_LOGGING_TIMEOUT); // [macOS]
||||||| 49f3f47b1e9
  dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
=======
  waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
  XCTAssertEqual(waitRet, 0, @"Timed out waiting for throwError");
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af

<<<<<<< HEAD
  // For local bundles, we'll first get a warning about symbolication
  if ([_bridge.bundleURL isFileURL]) {
    dispatch_semaphore_wait(_logSem, RCT_TEST_LOGGING_TIMEOUT); // [macOS]
||||||| 49f3f47b1e9
  // For local bundles, we'll first get a warning about symbolication
  if ([_bridge.bundleURL isFileURL]) {
    dispatch_semaphore_wait(_logSem, DISPATCH_TIME_FOREVER);
=======
  // For local bundles, we may first get a warning about symbolication
  if (![_lastLogMessage containsString:@"Error: Throwing an error"]) {
    waitRet = dispatch_semaphore_wait(_logSem, dispatch_time(DISPATCH_TIME_NOW, LOGGER_TIMEOUT));
    XCTAssertEqual(waitRet, 0, @"Timed out waiting for throwError #2");
>>>>>>> 890805db9cc639846c93edc0e13eddbf67dbc7af
  }

  XCTAssertEqual(_lastLogLevel, RCTLogLevelError);
  XCTAssertEqual(_lastLogSource, RCTLogSourceJavaScript);
  XCTAssertTrue([_lastLogMessage containsString:@"Error: Throwing an error"]);
}

@end
