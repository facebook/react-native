/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAssert.h"

NSString *const RCTErrorDomain = @"RCTErrorDomain";

static NSString *const RCTAssertFunctionStack = @"RCTAssertFunctionStack";

RCTAssertFunction RCTCurrentAssertFunction = nil;

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
  NSArray *functionStack = threadDictionary[RCTAssertFunctionStack];
  RCTAssertFunction assertFunction = functionStack.lastObject;
  if (assertFunction) {
    return assertFunction;
  }
  return RCTCurrentAssertFunction;
}

void RCTPerformBlockWithAssertFunction(void (^block)(void), RCTAssertFunction assertFunction)
{
  NSMutableDictionary *threadDictionary = [NSThread currentThread].threadDictionary;
  NSMutableArray *functionStack = threadDictionary[RCTAssertFunctionStack];
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
  NSString *threadName = thread.isMainThread ? @"main" : thread.name;
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
