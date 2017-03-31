// Copyright 2004-present Facebook. All Rights Reserved.

#ifdef WITH_JSC_EXTRA_TRACING

#include "JSCLegacyTracing.h"

#include <fbsystrace.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

#include "JSCTracing.h"

static const char *ENABLED_FBSYSTRACE_PROFILE_NAME = "__fbsystrace__";

using namespace facebook::react;

static JSValueRef nativeTraceBeginLegacy(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_LIKELY(argumentCount >= 1)) {
    uint64_t tag = tracingTagFromJSValue(ctx, arguments[0], exception);
    if (!fbsystrace_is_tracing(tag)) {
      return Value::makeUndefined(ctx);
    }
  }

  String title(ctx, ENABLED_FBSYSTRACE_PROFILE_NAME);
  #if WITH_REACT_INTERNAL_SETTINGS
  JSStartProfiling(ctx, title, true);
  #else
  JSStartProfiling(ctx, title);
  #endif

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
    uint64_t tag = tracingTagFromJSValue(ctx, arguments[0], exception);
    if (!fbsystrace_is_tracing(tag)) {
      return Value::makeUndefined(ctx);
    }
  }

  String title(ctx, ENABLED_FBSYSTRACE_PROFILE_NAME);
  JSEndProfiling(ctx, title);

  return Value::makeUndefined(ctx);
}

namespace facebook {
namespace react {

void addNativeTracingLegacyHooks(JSGlobalContextRef ctx) {
  installGlobalFunction(ctx, "nativeTraceBeginLegacy", nativeTraceBeginLegacy);
  installGlobalFunction(ctx, "nativeTraceEndLegacy", nativeTraceEndLegacy);
}

} }

#endif
