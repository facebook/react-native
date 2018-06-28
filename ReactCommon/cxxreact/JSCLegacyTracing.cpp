// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JSCLegacyTracing.h"

#if defined(WITH_JSC_EXTRA_TRACING)

#include <fbsystrace.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

static const char *ENABLED_FBSYSTRACE_PROFILE_NAME = "__fbsystrace__";

using namespace facebook::react;

static int64_t int64FromJSValue(JSContextRef ctx, JSValueRef value, JSValueRef* exception) {
  return static_cast<int64_t>(JSC_JSValueToNumber(ctx, value, exception));
}

static JSValueRef nativeTraceBeginLegacy(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_LIKELY(argumentCount >= 1)) {
    uint64_t tag = int64FromJSValue(ctx, arguments[0], exception);
    if (!fbsystrace_is_tracing(tag)) {
      return Value::makeUndefined(ctx);
    }
  }

  JSStartProfiling(ctx, String(ctx, ENABLED_FBSYSTRACE_PROFILE_NAME), true);

  return Value::makeUndefined(ctx);
}

static JSValueRef nativeTraceEndLegacy(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_LIKELY(argumentCount >= 1)) {
    uint64_t tag = int64FromJSValue(ctx, arguments[0], exception);
    if (!fbsystrace_is_tracing(tag)) {
      return Value::makeUndefined(ctx);
    }
  }

  JSEndProfiling(ctx, String(ctx, ENABLED_FBSYSTRACE_PROFILE_NAME));

  return Value::makeUndefined(ctx);
}

#endif

namespace facebook {
namespace react {

void addNativeTracingLegacyHooks(JSGlobalContextRef ctx) {
#if defined(WITH_JSC_EXTRA_TRACING)
  installGlobalFunction(ctx, "nativeTraceBeginLegacy", nativeTraceBeginLegacy);
  installGlobalFunction(ctx, "nativeTraceEndLegacy", nativeTraceEndLegacy);
#endif
}

} }
