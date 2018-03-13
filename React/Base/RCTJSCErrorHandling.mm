/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTJSCErrorHandling.h"

#import <jschelpers/JavaScriptCore.h>

#import "RCTAssert.h"
#import "RCTJSStackFrame.h"
#import "RCTLog.h"

NSString *const RCTJSExceptionUnsymbolicatedStackTraceKey = @"RCTJSExceptionUnsymbolicatedStackTraceKey";

NSError *RCTNSErrorFromJSError(JSValue *exception)
{
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  userInfo[NSLocalizedDescriptionKey] = [NSString stringWithFormat:@"Unhandled JS Exception: %@", [exception[@"name"] toString] ?: @"Unknown"];
  NSString *const exceptionMessage = [exception[@"message"] toString];
  if ([exceptionMessage length]) {
    userInfo[NSLocalizedFailureReasonErrorKey] = exceptionMessage;
  }
  NSString *const stack = [exception[@"stack"] toString];
  if ([@"undefined" isEqualToString:stack]) {
    RCTLogWarn(@"Couldn't get stack trace for %@:%@", exception[@"sourceURL"], exception[@"line"]);
  } else if ([stack length]) {
    NSArray<RCTJSStackFrame *> *const unsymbolicatedFrames = [RCTJSStackFrame stackFramesWithLines:stack];
    userInfo[RCTJSStackTraceKey] = unsymbolicatedFrames;
  }
  return [NSError errorWithDomain:RCTErrorDomain code:1 userInfo:userInfo];
}

NSError *RCTNSErrorFromJSErrorRef(JSValueRef exceptionRef, JSGlobalContextRef ctx)
{
  JSContext *context = [JSC_JSContext(ctx) contextWithJSGlobalContextRef:ctx];
  JSValue *exception = [JSC_JSValue(ctx) valueWithJSValueRef:exceptionRef inContext:context];
  return RCTNSErrorFromJSError(exception);
}
