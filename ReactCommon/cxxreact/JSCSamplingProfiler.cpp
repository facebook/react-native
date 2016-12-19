// Copyright 2004-present Facebook. All Rights Reserved.

#ifdef WITH_JSC_EXTRA_TRACING

#include "JSCSamplingProfiler.h"

#include <stdio.h>
#include <string.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

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
  installGlobalFunction(ctx, "pokeSamplingProfiler", pokeSamplingProfiler);
}

}
}

#endif // WITH_JSC_EXTRA_TRACING
