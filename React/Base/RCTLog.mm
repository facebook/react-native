/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLog.h"

#include <cxxabi.h>

#import <objc/message.h>

#import "RCTRedBoxSetEnabled.h"
#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTDefines.h"
#import "RCTUtils.h"

static NSString *const RCTLogFunctionStack = @"RCTLogFunctionStack";

const char *RCTLogLevels[] = {
  "trace",
  "info",
  "warn",
  "error",
  "fatal",
};

#if RCT_DEBUG
static const RCTLogLevel RCTDefaultLogThreshold = (RCTLogLevel)(RCTLogLevelInfo - 1);
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
  __unused RCTLogSource source,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
)
{
  NSString *log = RCTFormatLog([NSDate date], level, fileName, lineNumber, message);
  fprintf(stderr, "%s\n", log.UTF8String);
  fflush(stderr);
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
    RCTSetLogFunction(^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      existing(level, source, fileName, lineNumber, message);
      logFunction(level, source, fileName, lineNumber, message);
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
  NSArray<RCTLogFunction> *functionStack = threadDictionary[RCTLogFunctionStack];
  RCTLogFunction logFunction = functionStack.lastObject;
  if (logFunction) {
    return logFunction;
  }
  return RCTGetLogFunction();
}

void RCTPerformBlockWithLogFunction(void (^block)(void), RCTLogFunction logFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<RCTLogFunction> *functionStack = threadDictionary[RCTLogFunctionStack];
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
    RCTPerformBlockWithLogFunction(block, ^(RCTLogLevel level, RCTLogSource source,
                                            NSString *fileName, NSNumber *lineNumber,
                                            NSString *message) {
      logFunction(level, source, fileName, lineNumber, [prefix stringByAppendingString:message]);
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
    [log appendFormat:@"[%s]", RCTLogLevels[level]];
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

NSString *RCTFormatLogLevel(RCTLogLevel level)
{
    NSDictionary *levelsToString = @{@(RCTLogLevelTrace) : @"trace",
                                    @(RCTLogLevelInfo)    : @"info",
                                    @(RCTLogLevelWarning) : @"warning",
                                    @(RCTLogLevelFatal)   : @"fatal",
                                    @(RCTLogLevelError)   : @"error"};

    return levelsToString[@(level)];
}

NSString *RCTFormatLogSource(RCTLogSource source)
{
    NSDictionary *sourcesToString = @{@(RCTLogSourceNative) : @"native",
                                     @(RCTLogSourceJavaScript)    : @"js"};

    return sourcesToString[@(source)];
}

static NSRegularExpression *nativeStackFrameRegex()
{
  static dispatch_once_t onceToken;
  static NSRegularExpression *_regex;
  dispatch_once(&onceToken, ^{
    NSError *regexError;
    _regex = [NSRegularExpression regularExpressionWithPattern:@"0x[0-9a-f]+ (.*) \\+ (\\d+)$" options:0 error:&regexError];
    if (regexError) {
      RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
    }
  });
  return _regex;
}

void _RCTLogNativeInternal(RCTLogLevel level, const char *fileName, int lineNumber, NSString *format, ...)
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
      logFunction(level, RCTLogSourceNative, fileName ? @(fileName) : nil, lineNumber > 0 ? @(lineNumber) : nil, message);
    }

    // Log to red box if one is configured.
    if (RCTSharedApplication() && RCTRedBoxGetEnabled() && level >= RCTLOG_REDBOX_LEVEL) {
      NSArray<NSString *> *stackSymbols = [NSThread callStackSymbols];
      NSMutableArray<NSDictionary *> *stack =
        [NSMutableArray arrayWithCapacity:(stackSymbols.count - 1)];
      [stackSymbols enumerateObjectsUsingBlock:^(NSString *frameSymbols, NSUInteger idx, __unused BOOL *stop) {
        if (idx == 0) {
          // don't include the current frame
          return;
        }

        NSRange range = NSMakeRange(0, frameSymbols.length);
        NSTextCheckingResult *match = [nativeStackFrameRegex() firstMatchInString:frameSymbols options:0 range:range];
        if (!match) {
          return;
        }

        NSString *methodName = [frameSymbols substringWithRange:[match rangeAtIndex:1]];
        char *demangledName = abi::__cxa_demangle([methodName UTF8String], NULL, NULL, NULL);
        if (demangledName) {
          methodName = @(demangledName);
          free(demangledName);
        }

        if (idx == 1 && fileName) {
          NSString *file = [@(fileName) componentsSeparatedByString:@"/"].lastObject;
          [stack addObject:@{@"methodName": methodName, @"file": file, @"lineNumber": @(lineNumber)}];
        } else {
          [stack addObject:@{@"methodName": methodName}];
        }
      }];

      dispatch_async(dispatch_get_main_queue(), ^{
        // red box is thread safe, but by deferring to main queue we avoid a startup
        // race condition that causes the module to be accessed before it has loaded
        id redbox = [[RCTBridge currentBridge] moduleForName:@"RedBox" lazilyLoadIfNecessary:YES];
        if (redbox) {
          void (*showErrorMessage)(id, SEL, NSString *, NSMutableArray<NSDictionary *> *) = (__typeof__(showErrorMessage))objc_msgSend;
          SEL showErrorMessageSEL = NSSelectorFromString(@"showErrorMessage:withStack:");

          if ([redbox respondsToSelector:showErrorMessageSEL]) {
            showErrorMessage(redbox, showErrorMessageSEL, message, stack);
          }
        }
      });
    }

#if RCT_DEBUG
    if (!RCTRunningInTestEnvironment()) {
      // Log to JS executor
      [[RCTBridge currentBridge] logMessage:message level:level ? @(RCTLogLevels[level]) : @"info"];
    }
#endif

  }
}

void _RCTLogJavaScriptInternal(RCTLogLevel level, NSString *message)
{
  RCTLogFunction logFunction = RCTGetLocalLogFunction();
  BOOL log = RCT_DEBUG || (logFunction != nil);
  if (log && level >= RCTGetLogThreshold()) {
    if (logFunction) {
      logFunction(level, RCTLogSourceJavaScript, nil, nil, message);
    }
  }
}
