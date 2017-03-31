// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCSamplingProfiler.h"

#include <stdio.h>
#include <string.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

#ifndef __APPLE__
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#endif

namespace facebook {
namespace react {
namespace {
static JSValueRef pokeSamplingProfiler(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return JSC_JSPokeSamplingProfiler(ctx);
}
}

void initSamplingProfilerOnMainJSCThread(JSGlobalContextRef ctx) {
  JSC_JSStartSamplingProfilingOnMainJSCThread(ctx);

  // Allow the profiler to be poked from JS as well
  // (see SamplingProfiler.js for an example of how it could be used with the JSCSamplingProfiler module).
  installGlobalFunction(ctx, "pokeSamplingProfiler", pokeSamplingProfiler);
}

}
}
