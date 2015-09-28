/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTLog.h"

#include <asl.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTDefines.h"
#import "RCTRedBox.h"

@interface RCTBridge ()

+ (RCTBridge *)currentBridge;
- (void)logMessage:(NSString *)message level:(NSString *)level;

@end

static NSString *const RCTLogFunctionStack = @"RCTLogFunctionStack";

const char *RCTLogLevels[] = {
  "info",
  "warn",
  "error",
  "mustfix"
};

#if RCT_DEBUG
static const RCTLogLevel RCTDefaultLogThreshold = RCTLogLevelInfo - 1;
#else
static const RCTLogLevel RCTDefaultLogThreshold = RCTLogLevelError;
#endif

static RCTLogFunction RCTCurrentLogFunction;
static RCTLogLevel RCTCurrentLogThreshold = RCTDefaultLogThreshold;

RCTLogLevel RCTGetLogThreshold()
{
  return RCTCurrentLogThreshold;
}

void RCTSetLogThreshold(RCTLogLevel threshold) {
  RCTCurrentLogThreshold = threshold;
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

  int aslLevel = ASL_LEVEL_ERR;
  switch(level) {
    case RCTLogLevelInfo:
      aslLevel = ASL_LEVEL_NOTICE;
      break;
    case RCTLogLevelWarning:
      aslLevel = ASL_LEVEL_WARNING;
      break;
    case RCTLogLevelError:
      aslLevel = ASL_LEVEL_ERR;
      break;
    case RCTLogLevelMustFix:
      aslLevel = ASL_LEVEL_EMERG;
      break;
    default:
      aslLevel = ASL_LEVEL_DEBUG;
  }
  asl_log(NULL, NULL, aslLevel, "%s", message.UTF8String);
};

void RCTSetLogFunction(RCTLogFunction logFunction)
{
  RCTCurrentLogFunction = logFunction;
}

RCTLogFunction RCTGetLogFunction()
{
  if (!RCTCurrentLogFunction) {
    RCTCurrentLogFunction = RCTDefaultLogFunction;
  }
  return RCTCurrentLogFunction;
}

void RCTAddLogFunction(RCTLogFunction logFunction)
{
  RCTLogFunction existing = RCTGetLogFunction();
  if (existing) {
    RCTSetLogFunction(^(RCTLogLevel level,
                        NSString *fileName,
                        NSNumber *lineNumber,
                        NSString *message) {

      existing(level, fileName, lineNumber, message);
      logFunction(level, fileName, lineNumber, message);
    });
  } else {
    RCTSetLogFunction(logFunction);
  }
}

/**
 * returns the topmost stacked log function for the current thread, which
 * may not be the same as the current value of RCTCurrentLogFunction.
 */
static RCTLogFunction RCTGetLocalLogFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray *functionStack = threadDictionary[RCTLogFunctionStack];
  RCTLogFunction logFunction = functionStack.lastObject;
  if (logFunction) {
    return logFunction;
  }
  return RCTGetLogFunction();
}

void RCTPerformBlockWithLogFunction(void (^block)(void), RCTLogFunction logFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray *functionStack = threadDictionary[RCTLogFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[RCTLogFunctionStack] = functionStack;
  }
  [functionStack addObject:logFunction];
  block();
  [functionStack removeLastObject];
}

void RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix)
{
  RCTLogFunction logFunction = RCTGetLocalLogFunction();
  if (logFunction) {
    RCTPerformBlockWithLogFunction(block, ^(RCTLogLevel level, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      logFunction(level, fileName, lineNumber, [prefix stringByAppendingString:message]);
    });
  }
}

NSString *RCTFormatLog(
  NSDate *timestamp,
  RCTLogLevel level,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
)
{
  NSMutableString *log = [NSMutableString new];
  if (timestamp) {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [NSDateFormatter new];
      formatter.dateFormat = formatter.dateFormat = @"yyyy-MM-dd HH:mm:ss.SSS ";
    });
    [log appendString:[formatter stringFromDate:timestamp]];
  }
  if (level) {
    [log appendFormat:@"[%s]", RCTLogLevels[level - 1]];
  }

  [log appendFormat:@"[tid:%@]", RCTCurrentThreadName()];

  if (fileName) {
    fileName = fileName.lastPathComponent;
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
  NSString *format, ...
)
{
  RCTLogFunction logFunction = RCTGetLocalLogFunction();
  BOOL log = RCT_DEBUG || (logFunction != nil);
  if (log && level >= RCTGetLogThreshold()) {

    // Get message
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    // Call log function
    if (logFunction) {
      logFunction(level, fileName ? @(fileName) : nil, (lineNumber >= 0) ? @(lineNumber) : nil, message);
    }

#if RCT_DEBUG // Red box is only available in debug mode

    // Log to red box
    if ([UIApplication sharedApplication] && level >= RCTLOG_REDBOX_LEVEL) {
      NSArray *stackSymbols = [NSThread callStackSymbols];
      NSMutableArray *stack = [NSMutableArray arrayWithCapacity:(stackSymbols.count - 1)];
      [stackSymbols enumerateObjectsUsingBlock:^(NSString *frameSymbols, NSUInteger idx, __unused BOOL *stop) {
        if (idx > 0) { // don't include the current frame
          NSString *address = [[frameSymbols componentsSeparatedByString:@"0x"][1] componentsSeparatedByString:@" "][0];
          NSRange addressRange = [frameSymbols rangeOfString:address];
          NSString *methodName = [frameSymbols substringFromIndex:(addressRange.location + addressRange.length + 1)];
          if (idx == 1) {
            NSString *file = [@(fileName) componentsSeparatedByString:@"/"].lastObject;
            [stack addObject:@{@"methodName": methodName, @"file": file, @"lineNumber": @(lineNumber)}];
          } else {
            [stack addObject:@{@"methodName": methodName}];
          }
        }
      }];
      dispatch_async(dispatch_get_main_queue(), ^{
        // red box is thread safe, but by deferring to main queue we avoid a startup
        // race condition that causes the module to be accessed before it has loaded
        [[RCTBridge currentBridge].redBox showErrorMessage:message withStack:stack];
      });
    }

    // Log to JS executor
    [[RCTBridge currentBridge] logMessage:message level:level ? @(RCTLogLevels[level - 1]) : @"info"];

#endif

  }
}
