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
#import "RCTDefines.h"
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

__attribute__((constructor))
static void RCTLogSetup()
{
  RCTCurrentLogFunction = RCTDefaultLogFunction;

#if RCT_DEBUG
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
    [NSDate date], level, fileName, lineNumber, message
  );
  fprintf(stderr, "%s\n", log.UTF8String);
  fflush(stderr);
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

  [log appendFormat:@"[tid:%@]", RCTCurrentThreadName()];

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

void _RCTLogFormat(
  RCTLogLevel level,
  const char *fileName,
  int lineNumber,
  NSString *format, ...)
{

  BOOL log = RCT_DEBUG || (RCTCurrentLogFunction != nil);
  if (log && level >= RCTCurrentLogThreshold) {

    // Get message
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
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

#if RCT_DEBUG // Red box is only available in debug mode

    // Log to red box
    if (level >= RCTLOG_REDBOX_LEVEL) {
      NSArray *stackSymbols = [NSThread callStackSymbols];
      NSMutableArray *stack = [NSMutableArray arrayWithCapacity:(stackSymbols.count - 1)];
      [stackSymbols enumerateObjectsUsingBlock:^(NSString *frameSymbols, NSUInteger idx, __unused BOOL *stop) {
        if (idx > 0) { // don't include the current frame
          NSString *address = [[frameSymbols componentsSeparatedByString:@"0x"][1] componentsSeparatedByString:@" "][0];
          NSRange addressRange = [frameSymbols rangeOfString:address];
          NSString *methodName = [frameSymbols substringFromIndex:(addressRange.location + addressRange.length + 1)];
          if (idx == 1) {
            NSString *file = [[@(fileName) componentsSeparatedByString:@"/"] lastObject];
            [stack addObject:@{@"methodName": methodName, @"file": file, @"lineNumber": @(lineNumber)}];
          } else {
            [stack addObject:@{@"methodName": methodName}];
          }
        }
      }];
      [[RCTRedBox sharedInstance] showErrorMessage:message withStack:stack];
    }

    // Log to JS executor
    [RCTBridge logMessage:message level:level ? @(RCTLogLevels[level - 1]) : @"info"];

#endif

  }
}
