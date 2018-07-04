// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JSCSamplingProfiler.h"

#include <jschelpers/JSCHelpers.h>

static JSValueRef pokeSamplingProfiler(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return JSC_JSPokeSamplingProfiler(ctx);
}

namespace facebook {
namespace react {

void initSamplingProfilerOnMainJSCThread(JSGlobalContextRef ctx) {
  JSC_JSStartSamplingProfilingOnMainJSCThread(ctx);

  // Allow the profiler to be poked from JS as well
  // (see SamplingProfiler.js for an example of how it could be used with the JSCSamplingProfiler module).
  installGlobalFunction(ctx, "pokeSamplingProfiler", pokeSamplingProfiler);
}

} }
