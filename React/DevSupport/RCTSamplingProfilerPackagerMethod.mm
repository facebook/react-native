/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSamplingProfilerPackagerMethod.h"

#import <JavaScriptCore/JavaScriptCore.h>

#import <jschelpers/JavaScriptCore.h>

#import "RCTJSEnvironment.h"
#import "RCTLog.h"

#if RCT_DEV // Only supported in dev mode

@implementation RCTSamplingProfilerPackagerMethod {
  __weak id<RCTJSEnvironment> _jsEnvironment;
}

- (instancetype)initWithJSEnvironment:(id<RCTJSEnvironment>)jsEnvironment
{
  if (self = [super init]) {
    _jsEnvironment = jsEnvironment;
  }
  return self;
}

- (void)handleRequest:(__unused id)params withResponder:(RCTPackagerClientResponder *)responder
{
  JSGlobalContextRef globalContext = _jsEnvironment.jsContextRef;
  if (!JSC_JSSamplingProfilerEnabled(globalContext)) {
    [responder respondWithError:@"The JSSamplingProfiler is disabled. See 'iOS specific setup' section here https://fburl.com/u4lw7xeq for some help"];
    return;
  }

  // JSPokeSamplingProfiler() toggles the profiling process
  JSValueRef jsResult = JSC_JSPokeSamplingProfiler(globalContext);
  if (JSC_JSValueGetType(globalContext, jsResult) == kJSTypeNull) {
    [responder respondWithResult:@"started"];
  } else {
    JSContext *context = _jsEnvironment.jsContext;
    NSString *results = [[JSC_JSValue(globalContext) valueWithJSValueRef:jsResult inContext:context] toObject];
    [responder respondWithResult:results];
  }
}

- (void)handleNotification:(__unused id)params
{
  RCTLogError(@"%@ does not implement onNotification", [self class]);
}

@end

#endif
