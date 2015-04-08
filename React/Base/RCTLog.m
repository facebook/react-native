/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTLog.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTRedBox.h"

@interface RCTBridge (Logging)

+ (void)logMessage:(NSString *)message level:(NSString *)level;

@end

static NSString *const RCTLogPrefixStack = @"RCTLogPrefixStack";

const char *RCTLogLevels[] = {
  "info",
  "warn",
  "error",
  "mustfix"
};

static RCTLogFunction RCTCurrentLogFunction;
static RCTLogLevel RCTCurrentLogThreshold;

void RCTLogSetup(void) __attribute__((constructor));
void RCTLogSetup()
{
  RCTCurrentLogFunction = RCTDefaultLogFunction;

#if DEBUG
  RCTCurrentLogThreshold = RCTLogLevelInfo - 1;
#else
  RCTCurrentLogThreshold = RCTLogLevelError;
#endif

}

RCTLogFunction RCTDefaultLogFunction = ^(
  RCTLogLevel level,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
)
{
  NSString *log = RCTFormatLog(
    [NSDate date], [NSThread currentThread], level, fileName, lineNumber, message
  );
  fprintf(stderr, "%s\n", log.UTF8String);
};

void RCTSetLogFunction(RCTLogFunction logFunction)
{
  RCTCurrentLogFunction = logFunction;
}

RCTLogFunction RCTGetLogFunction()
{
  return RCTCurrentLogFunction;
}

void RCTAddLogFunction(RCTLogFunction logFunction)
{
  RCTLogFunction existing = RCTCurrentLogFunction;
  if (existing) {
    RCTCurrentLogFunction = ^(RCTLogLevel level,
                              NSString *fileName,
                              NSNumber *lineNumber,
                              NSString *message) {

      existing(level, fileName, lineNumber, message);
      logFunction(level, fileName, lineNumber, message);
    };
  } else {
    RCTCurrentLogFunction = logFunction;
  }
}

void RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray *prefixStack = threadDictionary[RCTLogPrefixStack];
  if (!prefixStack) {
    prefixStack = [[NSMutableArray alloc] init];
    threadDictionary[RCTLogPrefixStack] = prefixStack;
  }
  [prefixStack addObject:prefix];
  block();
  [prefixStack removeLastObject];
}

NSString *RCTFormatLog(
  NSDate *timestamp,
  NSThread *thread,
  RCTLogLevel level,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
)
{
  NSMutableString *log = [[NSMutableString alloc] init];
  if (timestamp) {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [[NSDateFormatter alloc] init];
      formatter.dateFormat = formatter.dateFormat = @"yyyy-MM-dd HH:mm:ss.SSS ";
    });
    [log appendString:[formatter stringFromDate:timestamp]];
  }
  if (level) {
    [log appendFormat:@"[%s]", RCTLogLevels[level - 1]];
  }
  if (thread) {
    NSString *threadName = [thread isMainThread] ? @"main" : thread.name;
    if (threadName.length == 0) {
#if DEBUG
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      threadName = @(dispatch_queue_get_label(dispatch_get_current_queue()));
#pragma clang diagnostic pop
#else
      threadName = [NSString stringWithFormat:@"%p", thread];
#endif
    }
    [log appendFormat:@"[tid:%@]", threadName];
  }
  if (fileName) {
    fileName = [fileName lastPathComponent];
    if (lineNumber) {
      [log appendFormat:@"[%@:%@]", fileName, lineNumber];
    } else {
      [log appendFormat:@"[%@]", fileName];
    }
  }
  if (message) {
    [log appendString:@" "];
    [log appendString:message];
  }
  return log;
}

void _RCTLogFormat(RCTLogLevel level, const char *fileName, int lineNumber, NSString *format, ...)
{
  if (RCTCurrentLogFunction && level >= RCTCurrentLogThreshold) {

    // Get message
    va_list args;
    va_start(args, format);
    __block NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    // Add prefix
    NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
    NSArray *prefixStack = threadDictionary[RCTLogPrefixStack];
    NSString *prefix = [prefixStack lastObject];
    if (prefix) {
      message = [prefix stringByAppendingString:message];
    }

    // Call log function
    RCTCurrentLogFunction(
      level, fileName ? @(fileName) : nil, (lineNumber >= 0) ? @(lineNumber) : nil, message
    );

#if DEBUG

    // Log to red box
    if (level >= RCTLOG_REDBOX_LEVEL) {
      [[RCTRedBox sharedInstance] showErrorMessage:message];
    }

    // Log to JS executor
    [RCTBridge logMessage:message level:level ? @(RCTLogLevels[level - 1]) : @"info"];

#endif

  }
}

#pragma mark - Deprecated

void RCTInjectLogFunction(void (^logFunction)(NSString *msg))
{
  RCTSetLogFunction(^(RCTLogLevel level,
                      NSString *fileName,
                      NSNumber *lineNumber,
                      NSString *message) {

    if (level > RCTLogLevelError) {

      // Use custom log function
      NSString *loc = fileName ? [NSString stringWithFormat:@"[%@:%@] ", fileName, lineNumber] : @"";
      logFunction([loc stringByAppendingString:message]);

    } else if (RCTDefaultLogFunction && level >= RCTCurrentLogThreshold) {

      // Use default logger
      RCTDefaultLogFunction(level, fileName, lineNumber, message);
    }
  });
}
