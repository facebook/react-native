/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAssert.h"
#import "RCTLog.h"

NSString *const RCTErrorDomain = @"RCTErrorDomain";
NSString *const RCTJSStackTraceKey = @"RCTJSStackTraceKey";
NSString *const RCTJSRawStackTraceKey = @"RCTJSRawStackTraceKey";
NSString *const RCTFatalExceptionName = @"RCTFatalException";
NSString *const RCTUntruncatedMessageKey = @"RCTUntruncatedMessageKey";

static NSString *const RCTAssertFunctionStack = @"RCTAssertFunctionStack";

RCTAssertFunction RCTCurrentAssertFunction = nil;
RCTFatalHandler RCTCurrentFatalHandler = nil;
RCTFatalExceptionHandler RCTCurrentFatalExceptionHandler = nil;

NSException *_RCTNotImplementedException(SEL, Class);
NSException *_RCTNotImplementedException(SEL cmd, Class cls)
{
  NSString *msg = [NSString stringWithFormat:@"%s is not implemented "
                   "for the class %@", sel_getName(cmd), cls];
  return [NSException exceptionWithName:@"RCTNotDesignatedInitializerException"
                                 reason:msg userInfo:nil];
}

void RCTSetAssertFunction(RCTAssertFunction assertFunction)
{
  RCTCurrentAssertFunction = assertFunction;
}

RCTAssertFunction RCTGetAssertFunction(void)
{
  return RCTCurrentAssertFunction;
}

void RCTAddAssertFunction(RCTAssertFunction assertFunction)
{
  RCTAssertFunction existing = RCTCurrentAssertFunction;
  if (existing) {
    RCTCurrentAssertFunction = ^(NSString *condition,
                                 NSString *fileName,
                                 NSNumber *lineNumber,
                                 NSString *function,
                                 NSString *message) {

      existing(condition, fileName, lineNumber, function, message);
      assertFunction(condition, fileName, lineNumber, function, message);
    };
  } else {
    RCTCurrentAssertFunction = assertFunction;
  }
}

/**
 * returns the topmost stacked assert function for the current thread, which
 * may not be the same as the current value of RCTCurrentAssertFunction.
 */
static RCTAssertFunction RCTGetLocalAssertFunction()
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSArray<RCTAssertFunction> *functionStack = threadDictionary[RCTAssertFunctionStack];
  RCTAssertFunction assertFunction = functionStack.lastObject;
  if (assertFunction) {
    return assertFunction;
  }
  return RCTCurrentAssertFunction;
}

void RCTPerformBlockWithAssertFunction(void (^block)(void), RCTAssertFunction assertFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray<RCTAssertFunction> *functionStack = threadDictionary[RCTAssertFunctionStack];
  if (!functionStack) {
    functionStack = [NSMutableArray new];
    threadDictionary[RCTAssertFunctionStack] = functionStack;
  }
  [functionStack addObject:assertFunction];
  block();
  [functionStack removeLastObject];
}

NSString *RCTCurrentThreadName(void)
{
  NSThread *thread = [NSThread currentThread];
  NSString *threadName = RCTIsMainQueue() || thread.isMainThread ? @"main" : thread.name;
  if (threadName.length == 0) {
    const char *label = dispatch_queue_get_label(DISPATCH_CURRENT_QUEUE_LABEL);
    if (label && strlen(label) > 0) {
      threadName = @(label);
    } else {
      threadName = [NSString stringWithFormat:@"%p", thread];
    }
  }
  return threadName;
}

void _RCTAssertFormat(
  const char *condition,
  const char *fileName,
  int lineNumber,
  const char *function,
  NSString *format, ...)
{
  RCTAssertFunction assertFunction = RCTGetLocalAssertFunction();
  if (assertFunction) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    assertFunction(@(condition), @(fileName), @(lineNumber), @(function), message);
  }
}

void RCTFatal(NSError *error)
{
  _RCTLogNativeInternal(RCTLogLevelFatal, NULL, 0, @"%@", error.localizedDescription);

  RCTFatalHandler fatalHandler = RCTGetFatalHandler();
  if (fatalHandler) {
    fatalHandler(error);
  } else {
#if DEBUG
    @try {
#endif
      NSString *name = [NSString stringWithFormat:@"%@: %@", RCTFatalExceptionName, error.localizedDescription];

      // Truncate the localized description to 175 characters to avoid wild screen overflows
      NSString *message = RCTFormatError(error.localizedDescription, error.userInfo[RCTJSStackTraceKey], 175);

      // Attach an untruncated copy of the description to the userInfo, in case it is needed
      NSMutableDictionary *userInfo = [error.userInfo mutableCopy];
      [userInfo setObject:RCTFormatError(error.localizedDescription, error.userInfo[RCTJSStackTraceKey], -1)
                   forKey:RCTUntruncatedMessageKey];

      // Expected resulting exception information:
      // name: RCTFatalException: <underlying error description>
      // reason: <underlying error description plus JS stack trace, truncated to 175 characters>
      // userInfo: <underlying error userinfo, plus untruncated description plus JS stack trace>
      @throw [[NSException alloc]  initWithName:name reason:message userInfo:userInfo];
#if DEBUG
    } @catch (NSException *e) {}
#endif
  }
}

void RCTSetFatalHandler(RCTFatalHandler fatalHandler)
{
  RCTCurrentFatalHandler = fatalHandler;
}

RCTFatalHandler RCTGetFatalHandler(void)
{
  return RCTCurrentFatalHandler;
}

NSString *RCTFormatError(NSString *message, NSArray<NSDictionary<NSString *, id> *> *stackTrace, NSUInteger maxMessageLength)
{
  if (maxMessageLength > 0 && message.length > maxMessageLength) {
    message = [[message substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
  }

  NSString *prettyStack = RCTFormatStackTrace(stackTrace);

  return [NSString stringWithFormat:@"%@%@%@", message, prettyStack ? @", stack:\n" : @"", prettyStack ? prettyStack : @""];
}

NSString *RCTFormatStackTrace(NSArray<NSDictionary<NSString *, id> *> *stackTrace) {
  if (stackTrace) {
    NSMutableString *prettyStack = [NSMutableString string];

    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"\\b((?:seg-\\d+(?:_\\d+)?|\\d+)\\.js)"
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:NULL];
    for (NSDictionary<NSString *, id> *frame in stackTrace) {
      NSString *fileName = [frame[@"file"] lastPathComponent];
      NSTextCheckingResult *match = fileName != nil ? [regex firstMatchInString:fileName options:0 range:NSMakeRange(0, fileName.length)] : nil;
      if (match) {
        fileName = [NSString stringWithFormat:@"%@:", [fileName substringWithRange:match.range]];
      } else {
        fileName = @"";
      }

      [prettyStack appendFormat:@"%@@%@%@:%@\n", frame[@"methodName"], fileName, frame[@"lineNumber"], frame[@"column"]];
    }

    return prettyStack;
  }
  return nil;
}

void RCTFatalException(NSException *exception)
{
  _RCTLogNativeInternal(RCTLogLevelFatal, NULL, 0, @"%@: %@", exception.name, exception.reason);

  RCTFatalExceptionHandler fatalExceptionHandler = RCTGetFatalExceptionHandler();
  if (fatalExceptionHandler) {
    fatalExceptionHandler(exception);
  } else {
#if DEBUG
    @try {
#endif
      @throw exception;
#if DEBUG
    } @catch (NSException *e) {}
#endif
  }
}

void RCTSetFatalExceptionHandler(RCTFatalExceptionHandler fatalExceptionHandler)
{
  RCTCurrentFatalExceptionHandler = fatalExceptionHandler;
}

RCTFatalExceptionHandler RCTGetFatalExceptionHandler(void)
{
  return RCTCurrentFatalExceptionHandler;
}
